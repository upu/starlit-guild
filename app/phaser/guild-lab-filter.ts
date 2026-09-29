import type Phaser from "phaser";
import { RoadSpriteFilter } from "./road-sprite-filter";

type Part = {
  image: Phaser.GameObjects.Image;
  key: string;
  frame: string | number;
  width: number;
  height: number;
  scale: number;
};

// Reuse adventure's unchanged, progressively halved frame cache. Always start
// from the original atlas when zooming, never from an already reduced texture.
export class GuildLabFilter {
  private parts: Part[] = [];
  private density = 0;
  private filter: RoadSpriteFilter;
  constructor(private scene: Phaser.Scene) {
    this.filter = new RoadSpriteFilter(scene);
  }
  add(image: Phaser.GameObjects.Image, scale = 1) {
    this.parts.push({
      image,
      key: image.texture.key,
      frame: image.frame.name,
      width: image.displayWidth,
      height: image.displayHeight,
      scale,
    });
    return image;
  }
  update() {
    const density = this.scene.cameras.main.zoom;
    if (density === this.density) return;
    this.density = density;
    for (const { image, key, frame, width, height, scale } of this.parts) {
      image.setTexture(key, frame).setDisplaySize(width * scale, height * scale);
      this.filter.apply(image);
      image.setDisplaySize(width, height);
      // A filtered frame has a different pixel size; refresh the default hit area.
      if (image.input) {
        this.scene.input.setHitAreaFromTexture(image);
        image.input.cursor = "pointer";
      }
    }
  }
}
