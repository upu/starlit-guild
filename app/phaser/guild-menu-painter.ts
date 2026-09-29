import type Phaser from "phaser";
import { guildRecipes, guildProducts } from "@/lib/guild-content";
import { guildGoodFrame, guildRecipeSpot, guildShopSpot } from "@/lib/guild-menu-model";
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
    if (input.site === "shop") this.shelf();
    const items = input.site === "shop" ? guildProducts : guildRecipes;
    items.forEach((item, i) => {
      const point = input.site === "shop" ? guildShopSpot(i) : guildRecipeSpot(i);
      const frame = guildGoodFrame("output" in item ? item.output : item.id);
      const selected = item.id === input.selected;
      const zoom = selected ? 1.1 + this.pulse.value * 0.08 : 1;
      const width = (input.site === "shop" ? 175 : 145) * zoom;
      const image = this.sprites.room(
        `menu-${item.id}`,
        "goods-v3",
        frame,
        { x: point.x * 1000, y: point.y * 750 - 22, width },
        1600,
      );
      const maxHeight =
        this.sprites.scene.scale.height * (input.site === "shop" ? 0.16 : 0.19) * zoom;
      if (image.displayHeight > maxHeight)
        image.setDisplaySize((image.displayWidth * maxHeight) / image.displayHeight, maxHeight);
      if (selected) this.glow(point.x, point.y, input.site === "shop");
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
  private glow(x: number, y: number, shop: boolean) {
    const w = this.sprites.scene.scale.width,
      h = this.sprites.scene.scale.height;
    this.highlight
      .lineStyle(2, 0xffda88, 0.9)
      .strokeEllipse(x * w, y * h - (22 * h) / 750 + 2, w * (shop ? 0.22 : 0.2), 14);
    this.highlight
      .fillStyle(0xffd17b, 0.16)
      .fillEllipse(x * w, y * h - (22 * h) / 750 + 2, w * 0.22, 18);
  }
}
