import type Phaser from "phaser";

// Cache small, isolated frames. Mipmaps can then filter each figure without
// sampling adjacent poses or padding every large atlas to a power of two.
export class RoadSpriteFilter {
  constructor(private scene: Phaser.Scene) {}

  apply(image: Phaser.GameObjects.Image) {
    const frame = image.frame,
      width = image.displayWidth,
      height = image.displayHeight,
      side = Math.max(64, Math.min(256, 2 ** Math.ceil(Math.log2(Math.max(width, height))))),
      key = `road-filter:${image.texture.key}:${frame.name}:${String(side)}`;
    if (!this.scene.textures.exists(key)) this.create(key, frame, side);
    const { originX, originY } = image;
    image.setTexture(key, "figure").setDisplaySize(width, height).setOrigin(originX, originY);
  }

  private create(key: string, frame: Phaser.Textures.Frame, side: number) {
    let source: CanvasImageSource = frame.source.image as HTMLImageElement,
      x = frame.cutX,
      y = frame.cutY,
      width = frame.cutWidth,
      height = frame.cutHeight;
    while (Math.max(width, height) > side * 2) {
      const next = document.createElement("canvas");
      next.width = Math.ceil(width / 2);
      next.height = Math.ceil(height / 2);
      this.draw(next, source, x, y, width, height, next.width, next.height);
      source = next;
      x = y = 0;
      width = next.width;
      height = next.height;
    }
    const canvas = document.createElement("canvas"),
      ratio = Math.min(1, side / Math.max(width, height)),
      w = Math.max(1, Math.round(width * ratio)),
      h = Math.max(1, Math.round(height * ratio));
    canvas.width = canvas.height = side;
    this.draw(canvas, source, x, y, width, height, w, h);
    this.scene.textures.addCanvas(key, canvas)?.add("figure", 0, 0, 0, w, h);
  }

  private draw(
    canvas: HTMLCanvasElement,
    source: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number,
    w: number,
    h: number,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw Error("人物画像の縮小処理を準備できませんでした。");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, x, y, width, height, 0, 0, w, h);
  }
}
