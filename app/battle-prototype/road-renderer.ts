import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/scrolling-battle";
import { RoadPainter, ROAD_BACKGROUND } from "./road-painter";

import {
  ROAD_EFFECTS,
  ROAD_HERB,
  ROAD_PUSH,
  ROAD_WORKSITES,
  ROAD_CARGO,
  ROAD_PUPPETS,
  roadSheet,
  roadWalkSheet,
} from "./road-art";

export type RoadBridge = {
  read: () => RoadBattle;
  assist: () => void;
  status: (value: "loading" | "ready" | "error") => void;
};

function roadScene(engine: typeof Phaser, bridge: RoadBridge, motion: MediaQueryList) {
  return new (class extends engine.Scene {
    painter?: RoadPainter;
    failed = false;
    preload() {
      this.load.on(engine.Loader.Events.FILE_LOAD_ERROR, () => {
        this.failed = true;
        bridge.status("error");
      });
      for (const asset of [
        ROAD_BACKGROUND,
        ROAD_HERB,
        ROAD_PUSH,
        ROAD_WORKSITES,
        ROAD_CARGO,
        ROAD_PUPPETS,
        "/sprites.png",
        roadSheet("aria"),
        roadSheet("leon"),
        roadSheet("mira"),
        ...(["aria", "leon", "mira"] as const).map(roadWalkSheet),
        ROAD_EFFECTS,
      ])
        this.load.image(asset, asset);
    }
    create() {
      if (this.failed) return;
      this.painter = new RoadPainter(this);
      this.input.on(engine.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
        if (pointer.button === 0 && pointer.getDistance() < 14) bridge.assist();
      });
      bridge.status("ready");
    }
    update() {
      if (!this.failed) this.painter?.paint(bridge.read(), motion.matches);
    }
  })({ key: "road-prototype" });
}

export function createRoadRenderer(parent: HTMLElement, bridge: RoadBridge, engine: typeof Phaser) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const game = new engine.Game({
    type: engine.AUTO,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    backgroundColor: "#142f27",
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false },
    scale: { mode: engine.Scale.NONE },
    fps: { target: 60 },
    scene: roadScene(engine, bridge, motion),
  });
  const observer = new ResizeObserver(() => {
    if (parent.clientWidth && parent.clientHeight)
      game.scale.resize(parent.clientWidth, parent.clientHeight);
  });
  observer.observe(parent);
  const contextLost = () => {
    bridge.status("error");
  };
  game.canvas.addEventListener("webglcontextlost", contextLost);
  return () => {
    observer.disconnect();
    game.canvas.removeEventListener("webglcontextlost", contextLost);
    game.destroy(true, false);
    if (game.isRunning) game.loop.wake();
  };
}
