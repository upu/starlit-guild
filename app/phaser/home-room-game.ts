import type Phaser from "phaser";
import { HomeLife, type RoomActivity } from "@/lib/home-room-life";
import { residentDisplayPosition, residentDisplayCell } from "@/lib/home-room-presentation";
import { homeMarkerPoint } from "@/lib/home-room-markers";
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
import { homeStaticFrames } from "@/lib/home-room-scenery";
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
      const ratio = residentDisplayCell(r) / residentArt.displayCell;
      return (
        Math.abs(p.x - point.x) < 20 * ratio &&
        point.y <= p.y + 5 &&
        point.y >= p.y - residentHeight * ratio - 2
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
    this.markers(input.furniture);
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
  private markers(items: Furniture[]) {
    const canvas = this.scene.game.canvas;
    const camera = this.scene.cameras.main;
    const corner = camera.getWorldPoint(0, 0);
    const scale = (camera.zoom * canvas.clientWidth) / canvas.width;
    canvas.parentElement?.parentElement
      ?.querySelectorAll<HTMLElement>("[data-home-marker]")
      .forEach((button) => {
        const point = homeMarkerPoint(items, button.dataset.homeMarker ?? "");
        const x = point ? (point.x - corner.x) * scale : -100;
        const y = point ? (point.y - corner.y) * scale : -100;
        const visible =
          x >= 22 && x <= canvas.clientWidth - 22 && y >= 22 && y <= canvas.clientHeight - 22;
        button.style.visibility = visible ? "visible" : "hidden";
        button.style.left = `${String(x)}px`;
        button.style.top = `${String(y)}px`;
        // Keep the status readable at the left edge while panning the room.
        button.style.setProperty("--status-shift", `${String(Math.max(0, 142 - x))}px`);
        const statusHeight =
          button.querySelector<HTMLElement>(".home-marker-status")?.offsetHeight ?? 0;
        button.style.setProperty(
          "--status-top",
          `${String(Math.max(-8, 26 + statusHeight - y))}px`,
        );
      });
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
          for (const suffix of ["", "-actions", "-tea", "-work", "-garden"])
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
    for (const suffix of ["", "-actions", "-tea", "-work", "-garden"])
      scene.load.spritesheet(homeAsset(id + suffix), homeAsset(id + suffix), {
        frameWidth: residentArt.cell,
        frameHeight: residentArt.cell,
      });
  for (const [sheet, frames] of Object.entries(homeStaticFrames))
    for (const i of frames)
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
