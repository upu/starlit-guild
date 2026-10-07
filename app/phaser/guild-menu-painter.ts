import type Phaser from "phaser";
import { guildProducts } from "@/lib/guild-content";
import { guildGoodFrame, guildShopSpot } from "@/lib/guild-menu-model";
import type { GuildFrame } from "./guild-painter";
import { GuildSprites } from "./guild-sprites";
export class GuildMenuPainter {
  private selected = "";
  private highlight: Phaser.GameObjects.Graphics;
  private pulse = { value: 0 };
  constructor(private sprites: GuildSprites) {
    this.highlight = sprites.scene.add.graphics().setDepth(1500);
  }
  clear() {
    this.highlight.clear();
  }
  paint(input: GuildFrame, reduced: boolean) {
    if (input.selected !== this.selected) {
      this.selected = input.selected ?? "";
      this.sprites.scene.tweens.killTweensOf(this.pulse);
      this.pulse.value = reduced ? 0 : 1;
      if (!reduced)
        this.sprites.scene.tweens.add({
          targets: this.pulse,
          value: 0,
          duration: 360,
          ease: "Cubic.Out",
        });
    }
    this.shelf();
    const items = guildProducts;
    items.forEach((item, i) => {
      const point = guildShopSpot(i);
      const frame = guildGoodFrame(item.id);
      const selected = item.id === input.selected;
      const zoom = selected ? 1.1 + this.pulse.value * 0.08 : 1;
      const width = 175 * zoom;
      const image = this.sprites.room(
        `menu-${item.id}`,
        "goods-v3",
        frame,
        { x: point.x * 1000, y: point.y * 750 - 22, width },
        1600,
      );
      const maxHeight = this.sprites.scene.scale.height * 0.16 * zoom;
      if (image.displayHeight > maxHeight)
        image.setDisplaySize((image.displayWidth * maxHeight) / image.displayHeight, maxHeight);
      if (selected) this.glow(point.x, point.y);
    });
  }
  private shelf() {
    const image = this.sprites.room(
      "cabinet",
      "furniture-v3",
      5,
      { x: 500, y: 746, width: 980 },
      -900,
    );
    image.setDisplaySize(
      this.sprites.scene.scale.width * 0.98,
      this.sprites.scene.scale.height * 0.98,
    );
  }
  private glow(x: number, y: number) {
    const w = this.sprites.scene.scale.width,
      h = this.sprites.scene.scale.height;
    this.highlight
      .lineStyle(2, 0xffda88, 0.9)
      .strokeEllipse(x * w, y * h - (22 * h) / 750 + 2, w * 0.22, 14);
    this.highlight
      .fillStyle(0xffd17b, 0.16)
      .fillEllipse(x * w, y * h - (22 * h) / 750 + 2, w * 0.22, 18);
  }
}
