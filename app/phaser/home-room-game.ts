import type Phaser from "phaser";
import { HomeLife, residentDisplayPosition, type RoomActivity } from "@/lib/home-room-life";
import { residentArt, residentIds, type ResidentId } from "@/lib/home-actor";
import {
  ROOM,
  layoutError,
  furnitureCatalog,
  type Furniture,
  type RoomSite,
} from "@/lib/home-room-layout";
import { HomeRoomArt, homeAsset } from "./home-room-art";
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
  private ghost?: Furniture;
  private lastMessage = "";
  constructor(
    private scene: Phaser.Scene,
    private bridge: HomeBridge,
  ) {
    this.art = new HomeRoomArt(scene);
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.tap(pointer);
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.preview(pointer);
    });
  }
  private point(pointer: Phaser.Input.Pointer) {
    // The room can scroll inside a panel without a window resize. Phaser's cached
    // canvas bounds may then be stale; convert the event using its current bounds.
    const event = pointer.event;
    const contact = "changedTouches" in event ? event.changedTouches[0] : event;
    const canvas = this.scene.game.canvas,
      bounds = canvas.getBoundingClientRect();
    return this.scene.cameras.main.getWorldPoint(
      ((contact.clientX - bounds.left) * canvas.width) / bounds.width,
      ((contact.clientY - bounds.top) * canvas.height) / bounds.height,
    );
  }
  private itemAt(x: number, y: number, input: HomeFrame) {
    return [...input.furniture].reverse().find((f) => {
      const { w, h } = furnitureCatalog[f.kind];
      return x >= f.x * 24 && x < (f.x + w) * 24 && y >= f.y * 24 && y < (f.y + h) * 24;
    });
  }
  private preview(pointer: Phaser.Input.Pointer) {
    const input = this.bridge.read();
    const item = input.adding ?? input.furniture.find((f) => f.id === input.selected);
    if (!input.editing || !item) {
      this.ghost = undefined;
      return;
    }
    const p = this.point(pointer);
    this.ghost = { ...item, x: Math.floor(p.x / 24), y: Math.floor(p.y / 24) };
  }
  private tap(pointer: Phaser.Input.Pointer) {
    const input = this.bridge.read(),
      point = this.point(pointer);
    if (input.editing) {
      this.editTap(pointer, input);
      return;
    }
    const person = [...this.life.residents].reverse().find((r) => {
      const p = residentDisplayPosition(r);
      return Math.abs(p.x - point.x) < 20 && point.y <= p.y + 5 && point.y >= p.y - 62;
    });
    if (person) this.life.greet(person.id);
    else {
      const f = this.itemAt(point.x, point.y, input);
      if (f) this.bridge.use(f.id);
    }
  }
  private editTap(pointer: Phaser.Input.Pointer, input: HomeFrame) {
    this.preview(pointer);
    if (this.ghost) {
      this.bridge.place(this.ghost);
      return;
    }
    const p = this.point(pointer),
      item = this.itemAt(p.x, p.y, input);
    if (item) this.bridge.select(item.id);
  }
  update(delta: number) {
    const input = this.bridge.read(),
      reduced = input.reduced || matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.life.sync(input.members, input.furniture, input.mode, reduced, input.working);
    if (!input.paused && !input.editing && !document.hidden)
      this.life.tick(delta, input.furniture, reduced);
    this.art.begin();
    this.art.background(input.site);
    for (const item of input.furniture)
      this.art.furniture(item, input.growth[item.id], this.life.residents, input.site);
    for (const person of this.life.residents) this.art.resident(person, this.life.time, reduced);
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
            this.textures.get(homeAsset(id + suffix)).setFilter(engine.Textures.FilterMode.LINEAR);
        this.controller = new HomeRoomController(this, bridge);
        bridge.status("ready");
      }
    }
    update(_time: number, delta: number) {
      this.cameras.main
        .setSize(game.canvas.width, game.canvas.height)
        .setZoom(Math.min(game.canvas.width / ROOM.width, game.canvas.height / ROOM.height))
        .centerOn(ROOM.width / 2, ROOM.height / 2);
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
    for (const scene of game.scene.getScenes(true)) {
      scene.cameras.main
        .setZoom(Math.min(width / ROOM.width, height / ROOM.height))
        .centerOn(ROOM.width / 2, ROOM.height / 2);
    }
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
