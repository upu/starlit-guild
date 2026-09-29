import type Phaser from "phaser";
import { guildLabArt } from "@/lib/guild-lab-art";
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
  ) {
    for (const [key, expression] of Object.entries(guildLabArt.head.expressions))
      for (const patch of expression.patches) {
        const image = this.patch(patch.frame, patch.rect);
        head.add(image);
        this.patches.push({ key, region: patch.region, image });
      }
    this.blink = this.patch(guildLabArt.head.blink.frame, guildLabArt.head.blink.rect);
    head.add(this.blink);
    this.cheeks = scene.add.graphics();
    this.cheeks.fillStyle(0xf07d99, 0.32);
    for (const x of [133, 228]) {
      const p = this.point(x, 237);
      this.cheeks.fillEllipse(p.x, p.y, 6, 2.5);
    }
    head.add(this.cheeks);
  }
  private point(x: number, y: number) {
    const [, , w, h] = guildLabArt.frames[0],
      s = guildLabArt.head.displayHeight / h;
    return { x: (x - w / 2) * s, y: (y - h) * s };
  }
  private patch(frame: number, rect: readonly number[]) {
    const p = this.point(rect[0], rect[1]),
      s = guildLabArt.head.displayHeight / guildLabArt.frames[0][3];
    return this.filter.add(
      this.scene.add
        .image(p.x, p.y, guildLabArt.asset, String(frame))
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
    this.blink.visible = blink && key !== "smile";
    this.cheeks.visible = feeling.blush;
  }
}
