import type Phaser from "phaser";
import { GuildLabController } from "./guild-lab-controller";
import { type LabMode, type LabPose } from "@/lib/guild-lab-model";
import { bindLabResolution, labBufferSize } from "./guild-lab-resolution";
import type { LabCameraView } from "@/lib/guild-lab-camera";
export type LabControls = {
  mode: LabMode;
  request: number;
  paused: boolean;
  grid: boolean;
  view: LabCameraView;
  greet: number;
};
export type LabBridge = {
  read: () => LabControls;
  visit: (mode: LabMode) => void;
  status: (value: "loading" | "ready" | "error") => void;
  activity: (value: LabPose) => void;
};
function countDrawCalls(game: Phaser.Game) {
  // maxTextures: 1 makes actual WebGL submissions the useful load metric.
  const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
  const gl = Reflect.get(renderer, "gl") as WebGLRenderingContext | undefined;
  let draws = 0;
  if (gl) {
    const arrays = gl.drawArrays.bind(gl);
    const elements = gl.drawElements.bind(gl);
    try {
      gl.drawArrays = (...args: Parameters<typeof gl.drawArrays>) => {
        draws++;
        arrays(...args);
      };
      gl.drawElements = (...args: Parameters<typeof gl.drawElements>) => {
        draws++;
        elements(...args);
      };
    } catch {
      /* A restricted context still renders; metric reports zero. */
    }
  }
  Object.assign(game, {
    labDrawMetrics: {
      take: () => {
        const value = draws;
        draws = 0;
        return gl ? value : -1;
      },
    },
  });
}
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
      for (const name of [
        "room-tiles-v1",
        "leon-parts-v3",
        "aria-parts-v1",
        "furniture-v3",
        "lab-table-v1",
        "lab-cookie-plate-v1",
        "lab-cookie-v1",
      ])
        this.load.image(`/guild/${name}.webp`, `/guild/${name}.webp`);
    }
    create() {
      if (failed) return;
      bindLabResolution(this, parent);
      this.controller = new GuildLabController(this, bridge);
      bridge.status("ready");
    }
    update(_now: number, delta: number) {
      if (!document.hidden) this.controller?.update(delta, motion.matches);
    }
  }
  const buffer = labBufferSize(parent);
  const game = new engine.Game({
    type: engine.AUTO,
    parent,
    width: buffer.width,
    height: buffer.height,
    backgroundColor: "#32281e",
    // Tilemap + many filtered part textures intermittently overdraw the head in
    // Phaser 4.2.1 Chromium WebGL. Separate texture batches preserve draw order.
    render: { maxTextures: 1 },
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false },
    fps: { target: 30 },
    scale: { mode: engine.Scale.NONE, expandParent: false },
    scene: new LabScene(),
  });
  countDrawCalls(game);
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
