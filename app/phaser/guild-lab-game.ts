import type Phaser from "phaser";
import { GuildLabController } from "./guild-lab-controller";
import { LAB_WIDTH, LAB_HEIGHT, type LabMode, type LabPose } from "@/lib/guild-lab-model";
export type LabControls = {
  mode: LabMode;
  request: number;
  paused: boolean;
  grid: boolean;
  close: boolean;
};
export type LabBridge = {
  read: () => LabControls;
  visit: (mode: LabMode) => void;
  status: (value: "loading" | "ready" | "error") => void;
  activity: (value: LabPose) => void;
};
export function createGuildLabGame(parent: HTMLElement, bridge: LabBridge, engine: typeof Phaser) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let failed = false;
  class LabScene extends engine.Scene {
    controller?: GuildLabController;
    preload() {
      this.load.on(engine.Loader.Events.FILE_LOAD_ERROR, () => {
        failed = true;
        bridge.status("error");
      });
      for (const name of ["room-tiles-v1", "leon-parts-v1", "furniture-v3"])
        this.load.image(`/guild/${name}.webp`, `/guild/${name}.webp`);
    }
    create() {
      if (failed) return;
      this.controller = new GuildLabController(this, bridge);
      bridge.status("ready");
    }
    update(_now: number, delta: number) {
      if (!document.hidden) this.controller?.update(delta, motion.matches);
    }
  }
  // Match Phaser input space to the actual buffer; CSS scales both through the canvas bounds.
  const density = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const game = new engine.Game({
    type: engine.AUTO,
    parent,
    width: LAB_WIDTH * density,
    height: LAB_HEIGHT * density,
    backgroundColor: "#32281e",
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false },
    fps: { target: 30 },
    scale: { mode: engine.Scale.NONE, expandParent: false },
    scene: new LabScene(),
  });
  const lost = () => {
    bridge.status("error");
  };
  game.canvas.addEventListener("webglcontextlost", lost);
  return {
    destroy: () => {
      game.canvas.removeEventListener("webglcontextlost", lost);
      game.destroy(true);
    },
  };
}
