import type Phaser from "phaser";
import { HomeLife, type RoomActivity } from "@/lib/home-room-life";
import { residentDisplayPosition } from "@/lib/home-room-presentation";
import { residentArt, residentHeight, residentIds, type ResidentId } from "@/lib/home-actor";
import {
  ROOM,
  layoutError,
  furnitureCatalog,
  type Furniture,
  type RoomSite,
} from "@/lib/home-room-layout";
import { HomeRoomArt, homeAsset } from "./home-room-art";
import { HomeRoomView } from "./home-room-view";
export type HomeFrame = {
  site: RoomSite;
  furniture: Furniture[];
  members: ResidentId[];
  mode: RoomActivity;
  paused: boolean;
  editing: boolean;
  selected?: string;
  adding?: Furniture;
  growth: Record<string, number>;
  reduced: boolean;
  working?: ResidentId;
  zoomed: boolean;
};
export type HomeBridge = {
  read: () => HomeFrame;
  status: (status: "loading" | "ready" | "error") => void;
  message: (message: string) => void;
  select: (id: string) => void;
  place: (item: Furniture) => void;
  use: (id: string) => void;
};
export class HomeRoomController {
  readonly life = new HomeLife();
  private art: HomeRoomArt;
  private view: HomeRoomView;
  private ghost?: Furniture;
  private lastMessage = "";
  constructor(
    private scene: Phaser.Scene,
    private bridge: HomeBridge,
  ) {
    this.art = new HomeRoomArt(scene);
    this.view = new HomeRoomView(
      scene,
      (point) => {
        this.tap(point);
      },
      (point) => {
        this.preview(point);
      },
    );
  }
  private itemAt(x: number, y: number, input: HomeFrame) {
    return [...input.furniture].reverse().find((f) => {
      const { w, h } = furnitureCatalog[f.kind];
      return x >= f.x * 24 && x < (f.x + w) * 24 && y >= f.y * 24 && y < (f.y + h) * 24;
    });
  }
  private preview(p: { x: number; y: number }) {
    const input = this.bridge.read();
    const item = input.adding ?? input.furniture.find((f) => f.id === input.selected);
    if (!input.editing || !item) {
      this.ghost = undefined;
      return;
    }
    this.ghost = { ...item, x: Math.floor(p.x / 24), y: Math.floor(p.y / 24) };
  }
  private tap(point: { x: number; y: number }) {
    const input = this.bridge.read();
    if (input.editing) {
      this.editTap(point, input);
      return;
    }
    const person = [...this.life.residents].reverse().find((r) => {
      const p = residentDisplayPosition(r, input.furniture);
      return (
        Math.abs(p.x - point.x) < 20 && point.y <= p.y + 5 && point.y >= p.y - residentHeight - 2
      );
    });
    if (person) this.life.greet(person.id);
    else {
      const f = this.itemAt(point.x, point.y, input);
      if (f) this.bridge.use(f.id);
    }
  }
  private editTap(p: { x: number; y: number }, input: HomeFrame) {
    this.preview(p);
    if (this.ghost) {
      this.bridge.place(this.ghost);
      return;
    }
    const item = this.itemAt(p.x, p.y, input);
    if (item) this.bridge.select(item.id);
  }
  update(delta: number) {
    const input = this.bridge.read(),
      reduced = input.reduced || matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.view.update(input.zoomed);
    this.life.sync(input.members, input.furniture, input.mode, reduced, input.working);
    if (!input.paused && !input.editing && !document.hidden)
      this.life.tick(delta, input.furniture, reduced);
    this.art.begin();
    this.art.background(input.site);
    for (const item of input.furniture)
      this.art.furniture(item, input.growth[item.id], this.life.residents, input.site);
    for (const person of this.life.residents)
      this.art.resident(person, this.life.time, reduced, input.furniture);
    if (input.editing) {
      const candidate = this.ghost
        ? [...input.furniture.filter((f) => f.id !== this.ghost?.id), this.ghost]
        : input.furniture;
      this.art.grid(input.furniture, input.selected, this.ghost, !!layoutError(candidate));
    } else this.ghost = undefined;
    this.art.finish();
    if (this.lastMessage !== this.life.event) {
      this.lastMessage = this.life.event;
      this.bridge.message(this.lastMessage);
    }
  }
}
export function createHomeRoom(parent: HTMLElement, bridge: HomeBridge, engine: typeof Phaser) {
  let disposed = false,
    failed = false;
  class RoomScene extends engine.Scene {
    controller?: HomeRoomController;
    preload() {
      this.load.on(engine.Loader.Events.FILE_LOAD_ERROR, () => {
        failed = true;
        bridge.status("error");
      });
      preloadHomeAssets(this);
    }
    create() {
      if (!failed) {
        for (const id of residentIds)
          for (const suffix of ["", "-actions"])
            this.textures.get(homeAsset(id + suffix)).setFilter(engine.Textures.FilterMode.NEAREST);
        this.controller = new HomeRoomController(this, bridge);
        bridge.status("ready");
      }
    }
    update(_time: number, delta: number) {
      if (!disposed && !failed) this.controller?.update(delta);
    }
  }
  const game = new engine.Game({
    type: engine.AUTO,
    parent,
    width: ROOM.width,
    height: ROOM.height,
    backgroundColor: "#38291e",
    banner: false,
    audio: { noAudio: true },
    pixelArt: true,
    antialias: false,
    fps: { target: 30 },
    scale: { mode: engine.Scale.NONE, expandParent: false },
    scene: new RoomScene(),
  });
  const detach = attachHomeCanvas(game, parent, () => {
    failed = true;
    bridge.status("error");
  });
  return {
    game,
    destroy() {
      disposed = true;
      detach();
      game.destroy(true);
    },
  };
}
function preloadHomeAssets(scene: Phaser.Scene) {
  for (const id of residentIds)
    for (const suffix of ["", "-actions"])
      scene.load.spritesheet(homeAsset(id + suffix), homeAsset(id + suffix), {
        frameWidth: residentArt.cell,
        frameHeight: residentArt.cell,
      });
  for (let i = 0; i < 12; i++)
    scene.load.image(homeAsset(`prop-${String(i)}`), homeAsset(`prop-${String(i)}`));
  for (let i = 0; i < 6; i++)
    scene.load.image(homeAsset(`tile-${String(i)}`), homeAsset(`tile-${String(i)}`));
  for (const sheet of ["icons", "decor"])
    for (let i = 0; i < 6; i++)
      scene.load.image(homeAsset(`${sheet}-${String(i)}`), homeAsset(`${sheet}-${String(i)}`));
}
function attachHomeCanvas(game: Phaser.Game, parent: HTMLElement, lost: () => void) {
  function resize() {
    if (!parent.clientWidth) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.round(parent.clientWidth * dpr),
      height = Math.round(parent.clientHeight * dpr);
    game.scale.resize(width, height);
    game.canvas.style.width = `${String(parent.clientWidth)}px`;
    game.canvas.style.height = `${String(parent.clientHeight)}px`;
    game.scale.updateBounds();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(parent);
  game.canvas.addEventListener("webglcontextlost", lost);
  window.addEventListener("resize", resize);
  return () => {
    observer.disconnect();
    window.removeEventListener("resize", resize);
    game.canvas.removeEventListener("webglcontextlost", lost);
  };
}
