import type Phaser from "phaser";
import { GuildPainter, guildAssets, type GuildFrame } from "./guild-painter";
import { bindAdventureResolution } from "./adventure-resolution";
export type GuildBridge = {
  read: () => GuildFrame;
  status: (status: "loading" | "ready" | "error") => void;
};
export function createGuildGame(parent: HTMLElement, bridge: GuildBridge, engine: typeof Phaser) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false,
    failed = false;
  class GuildScene extends engine.Scene {
    painter?: GuildPainter;
    preload() {
      this.load.on(engine.Loader.Events.FILE_LOAD_ERROR, () => {
        failed = true;
        bridge.status("error");
      });
      for (const asset of guildAssets()) this.load.image(asset, asset);
    }
    create() {
      if (!failed) {
        bindAdventureResolution(this);
        this.painter = new GuildPainter(this);
        bridge.status("ready");
      }
    }
    update(_time: number, delta: number) {
      if (!disposed && !failed && !document.hidden)
        this.painter?.paint(bridge.read(), delta, motion.matches);
    }
  }
  const game = new engine.Game({
    type: engine.AUTO,
    parent,
    width: Math.max(1, parent.clientWidth),
    height: Math.max(1, parent.clientHeight),
    backgroundColor: "#263e30",
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false },
    antialias: true,
    fps: { target: 30 },
    scale: { mode: engine.Scale.NONE, expandParent: false },
    scene: new GuildScene(),
  });
  const lost = () => {
    bridge.status("error");
  };
  game.canvas.addEventListener("webglcontextlost", lost);
  return {
    resize(w: number, h: number) {
      if (!disposed && w > 0 && h > 0) game.scale.resize(w, h);
    },
    destroy() {
      disposed = true;
      game.canvas.removeEventListener("webglcontextlost", lost);
      game.destroy(true);
    },
  };
}
