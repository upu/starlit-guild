import type Phaser from "phaser";
import { LAB_HEIGHT, LAB_WIDTH } from "@/lib/guild-lab-model";

export function labBufferSize(parent: HTMLElement) {
  const density = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const width = Math.max(1, parent.clientWidth);
  return { width: Math.round(width * density), height: Math.round(parent.clientHeight * density) };
}

export function bindLabResolution(scene: Phaser.Scene, parent: HTMLElement) {
  const sync = () => {
    const { width, height } = labBufferSize(parent);
    // Scale Manager converts CSS pointer positions into buffer coordinates once.
    // Keep its dimensions identical to the renderer, including after a resize.
    if (scene.scale.width !== width || scene.scale.height !== height)
      scene.scale.resize(width, height);
    scene.cameras.main.setSize(width, height).setZoom(width / LAB_WIDTH, height / LAB_HEIGHT);
  };
  const observer = new ResizeObserver(sync);
  observer.observe(parent);
  window.addEventListener("resize", sync);
  scene.events.once("shutdown", () => {
    observer.disconnect();
    window.removeEventListener("resize", sync);
  });
  sync();
}
