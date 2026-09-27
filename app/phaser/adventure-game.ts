import type Phaser from "phaser";
import type { AdventureBridge, AdventureRenderer } from "./renderer-session";
import { ChapterRoadPainter, chapterRoadAssets } from "./chapter-road-painter";
import { bindAdventureResolution, syncAdventureResolution } from "./adventure-resolution";

type RuntimeState = { disposed: boolean; paused: boolean; created: boolean; reduced: boolean };

function sceneClass(
  engine: typeof Phaser,
  bridge: AdventureBridge,
  runtime: RuntimeState,
  syncPause: () => void,
) {
  return class AdventureScene extends engine.Scene {
    painter: ChapterRoadPainter;
    constructor() {
      super("adventure");
      this.painter = new ChapterRoadPainter(this, bridge, engine, runtime, syncPause);
    }
    preload() {
      this.load.on(engine.Loader.Events.FILE_LOAD_ERROR, () => {
        this.painter.failed = true;
        bridge.status("error");
      });
      for (const asset of chapterRoadAssets(bridge.read())) this.load.image(asset, asset);
    }
    create() {
      try {
        bindAdventureResolution(this);
        this.painter.initialize();
      } catch (error) {
        this.painter.failed = true;
        console.error("Adventure setup failed", error);
        bridge.status("error");
      }
    }
    stopMotion() {
      this.painter.stopMotion();
    }
    update() {
      if (!runtime.created || runtime.disposed || runtime.paused || this.painter.failed) return;
      try {
        this.painter.paint();
      } catch (error) {
        this.painter.failed = true;
        console.error("Adventure scene failed", error);
        bridge.status("error");
      }
    }
  };
}

function createPhaserGame(
  parent: HTMLElement,
  scene: Phaser.Scene,
  engine: typeof Phaser,
  width: number,
  height: number,
) {
  return new engine.Game({
    type: engine.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#193d30",
    banner: false,
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    mipmapFilter: "LINEAR_MIPMAP_LINEAR",
    roundPixels: false,
    audio: { noAudio: true },
    input: { keyboard: false },
    scale: { mode: engine.Scale.NONE, expandParent: false },
    fps: { target: 60 },
    scene,
  });
}

// This module is imported only after mounting in the browser. It never runs on the server.
export function createAdventureGame(
  parent: HTMLElement,
  bridge: AdventureBridge,
  engine: typeof Phaser,
): AdventureRenderer {
  const runtime: RuntimeState = { disposed: false, paused: false, created: false, reduced: false };
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  runtime.reduced = motion.matches;
  let game: Phaser.Game;
  function syncPause() {
    if (runtime.disposed || !runtime.created) return;
    if (runtime.paused) game.loop.sleep();
    else game.loop.wake();
  }
  const Scene = sceneClass(engine, bridge, runtime, syncPause),
    scene = new Scene();
  const onMotion = () => {
    runtime.reduced = motion.matches;
    if (runtime.reduced && runtime.created) scene.stopMotion();
  };
  motion.addEventListener("change", onMotion);
  const width = Math.max(1, parent.clientWidth),
    height = Math.max(1, parent.clientHeight);
  try {
    game = createPhaserGame(parent, scene, engine, width, height);
  } catch (error) {
    motion.removeEventListener("change", onMotion);
    throw error;
  }
  const contextLost = () => {
    if (!runtime.disposed) bridge.status("error");
  };
  game.canvas.addEventListener("webglcontextlost", contextLost);
  return {
    resize(w, h) {
      if (runtime.disposed || w <= 0 || h <= 0) return;
      if (game.scale.width !== w || game.scale.height !== h) game.scale.resize(w, h);
      if (runtime.created) {
        syncAdventureResolution(scene);
        scene.stopMotion();
      }
      if (runtime.created && !runtime.paused) game.scale.updateBounds();
    },
    setPaused(value) {
      if (runtime.paused === value) return;
      runtime.paused = value;
      syncPause();
    },
    destroy() {
      if (runtime.disposed) return;
      runtime.disposed = true;
      motion.removeEventListener("change", onMotion);
      game.canvas.removeEventListener("webglcontextlost", contextLost);
      game.destroy(true, false);
      if (game.isRunning) game.loop.wake();
    },
  };
}
