import type Phaser from "phaser";

/** Separate waist pivots preserve the cape/arm depths around the two legs. */
export class GuildLabUpper {
  private parts: {
    pivot: Phaser.GameObjects.Container;
    part: Phaser.GameObjects.GameObject & { depth: number };
  }[] = [];
  constructor(
    private scene: Phaser.Scene,
    private body: Phaser.GameObjects.Container,
    private waist: number,
  ) {}
  add(part: Phaser.GameObjects.GameObject & { depth: number }) {
    const content = this.scene.add.container(0, -this.waist, [part]);
    const pivot = this.scene.add.container(0, this.waist, [content]).setDepth(part.depth);
    this.parts.push({ pivot, part });
    this.body.add(pivot);
  }
  paint(lean: number) {
    for (const { pivot, part } of this.parts) pivot.setRotation(lean).setDepth(part.depth);
    this.body.sort("depth");
  }
}
