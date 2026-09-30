import type Phaser from "phaser";
import type { LabCharacterArt } from "@/lib/guild-lab-characters";
import type { LabFeeling } from "@/lib/guild-lab-affection";
import type { GuildLabFilter } from "./guild-lab-filter";
import { LAB_ACTOR_SCALE } from "@/lib/guild-lab-model";

export class GuildLabFace {
  private patches: { key: string; region: string; image: Phaser.GameObjects.Image }[] = [];
  private blink: Phaser.GameObjects.Image;
  private cheeks: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    head: Phaser.GameObjects.Container,
    private filter: GuildLabFilter,
    private art: LabCharacterArt,
  ) {
    const expressions = art.head.expressions as Record<
      string,
      {
        patches: readonly { frame: number; rect: readonly number[]; region: string }[];
      }
    >;
    for (const [key, expression] of Object.entries(expressions))
      for (const patch of expression.patches) {
        const image = this.patch(patch.frame, patch.rect);
        head.add(image);
        this.patches.push({ key, region: patch.region, image });
      }
    this.blink = this.patch(art.head.blink.frame, art.head.blink.rect);
    head.add(this.blink);
    this.cheeks = scene.add.graphics();
    this.cheeks.fillStyle(0xf07d99, 0.32);
    for (const x of art.asset.includes("aria") ? [205, 290] : [133, 228]) {
      const p = this.point(x, art.asset.includes("aria") ? 243 : 237);
      this.cheeks.fillEllipse(p.x, p.y, 6, 2.5);
    }
    head.add(this.cheeks);
  }
  private point(x: number, y: number) {
    const [, , w, h] = this.art.frames[0],
      s = this.art.head.displayHeight / h;
    return { x: (x - w / 2) * s, y: (y - h) * s };
  }
  private patch(frame: number, rect: readonly number[]) {
    const p = this.point(rect[0], rect[1]),
      s = this.art.head.displayHeight / this.art.frames[0][3];
    return this.filter.add(
      this.scene.add
        .image(p.x, p.y, this.art.asset, String(frame))
        .setOrigin(0, 0)
        .setDisplaySize(rect[2] * s, rect[3] * s),
      LAB_ACTOR_SCALE,
    );
  }
  paint(feeling: LabFeeling, blink: boolean) {
    const key = feeling.yawn ? "yawn" : feeling.expression;
    for (const patch of this.patches) {
      const selected = key === "shy" ? (patch.region === "eyes" ? "neutral" : "smile") : key;
      patch.image.visible = patch.key === selected;
    }
    this.blink.visible = blink && key !== "smile" && key !== "yawn";
    this.cheeks.visible = feeling.blush;
  }
}
