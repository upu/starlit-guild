import type Phaser from "phaser";

/** Commit the last visible frame before stopping RAF, including an initially paused scene. */
export function freezeAdventureScene(
  scene: Phaser.Scene,
  paint: () => void,
  failed: () => boolean,
  assetsLoading: () => boolean = () => false,
) {
  paint();
  if (!failed()) renderAdventureSnapshot(scene);
  // Phaser finalizes queued images on its loop. Keep that loop alive while
  // the paused runtime continues to prevent simulation and action updates.
  if (assetsLoading()) scene.game.loop.wake();
  else scene.game.loop.sleep();
}

/** Resizing clears the drawing buffer even when the animation loop is asleep. */
export function renderAdventureSnapshot(scene: Phaser.Scene) {
  const { game } = scene;
  game.renderer.preRender();
  game.scene.render(game.renderer);
  game.renderer.postRender();
}

// Keep layout and pointer coordinates in CSS pixels; only the drawing buffer
// and camera use device pixels. Cap GPU fill cost on very dense displays.
export function syncAdventureResolution(scene: Phaser.Scene) {
  const { width, height } = scene.scale;
  const density = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const pixelWidth = Math.round(width * density);
  const pixelHeight = Math.round(height * density);
  const { canvas, renderer } = scene.game;
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  if (renderer.width !== pixelWidth || renderer.height !== pixelHeight)
    renderer.resize(pixelWidth, pixelHeight);
  scene.cameras.main
    .setSize(pixelWidth, pixelHeight)
    .setZoom(pixelWidth / width, pixelHeight / height)
    .setScroll((width - pixelWidth) / 2, (height - pixelHeight) / 2);
}

export function bindAdventureResolution(scene: Phaser.Scene) {
  const sync = () => {
    syncAdventureResolution(scene);
  };
  scene.scale.on("resize", sync);
  scene.events.once("shutdown", () => scene.scale.off("resize", sync));
  sync();
}
