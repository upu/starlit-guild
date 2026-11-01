import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { nightHandheld, handheldWidth } from "@/lib/road-handheld";
import { roadHeroSize, roadX, roadY } from "@/lib/road-layout";

export class RoadNightLights {
  private lantern?: Phaser.GameObjects.Image;
  private light: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    this.light = scene.add.graphics().setDepth(3);
  }
  paint(
    state: RoadBattle,
    look: RoadLook | undefined,
    reduced: boolean,
    point?: { x: number; lane: number },
  ) {
    this.light.clear();
    this.lantern?.setVisible(false);
    if (!nightHandheld(look)) return;
    const { width, height } = this.scene.scale,
      size = roadHeroSize(width, height);
    const leon = state.heroes.find((h) => h.id === "leon");
    if (leon) {
      const figure = (size * 0.9) / 144,
        x = roadX(leon.x, state.distance, width, state.stage) - 28 * figure * leon.facing,
        // The hook belongs at the bag fastening, not at the boot. The lantern
        // extends downward from this point and remains clear of the ground.
        y = roadY(leon.lane, height, width) - 82 * figure;
      this.lantern ??= this.scene.add
        .image(0, 0, "/storybook-study/night-lantern-v1.webp")
        .setOrigin(0.5, 0);
      const source = this.lantern.texture.getSourceImage() as HTMLImageElement;
      const lanternHeight = (size * 0.14 * source.height) / source.width;
      this.lantern
        .setVisible(true)
        .setPosition(x, y)
        .setDisplaySize(size * 0.14, lanternHeight)
        .setDepth(10 + leon.lane * 10 + 0.02)
        .setFlipX(leon.facing < 0);
      this.glow(x, y + lanternHeight * 0.5, size * 0.6, 0xffc57a, 0.018);
      this.pool(x, roadY(leon.lane, height, width), size * 0.9, 0xf5ba6c);
    }
    // Reuse the prop renderer's actual point, including its current gait frame.
    if (!point) return;
    const x = roadX(point.x, state.distance, width, state.stage),
      y = roadY(point.lane, height, width),
      jarWidth = handheldWidth("moss-jar", { width, height }),
      pulse = reduced ? 1 : 1 + Math.sin(state.time / 1800) * 0.08;
    this.glow(x, y - jarWidth * 0.6, jarWidth * 2.2, 0xd8f6a2, 0.012 * pulse);
    const item = state.handheld?.find((i) => i.kind === "moss-jar"),
      aria = state.heroes.find((h) => h.id === "aria");
    const groundY = item?.phase === "ground" || !aria ? y : roadY(aria.lane, height, width);
    this.pool(x, groundY, size * 0.6, 0xd8f6a2);
  }
  private glow(x: number, y: number, r: number, color: number, alpha: number) {
    for (let n = 12; n > 0; n--)
      this.light.fillStyle(color, alpha).fillEllipse(x, y, (r * n) / 12, (r * n) / 12);
  }
  private pool(x: number, y: number, r: number, color: number) {
    for (let n = 10; n > 0; n--)
      this.light.fillStyle(color, 0.009).fillEllipse(x, y, (r * n) / 10, (r * 0.35 * n) / 10);
  }
}
