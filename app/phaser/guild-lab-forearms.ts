import type Phaser from "phaser";
import type { LabCharacterRig } from "@/lib/guild-lab-rig";
import type { GuildLabUpper } from "./guild-lab-upper";

type Arm = {
  upper: Phaser.GameObjects.Container;
  lower: Phaser.GameObjects.Container;
  lowerArtwork: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
};
// Drawings may cross the torso/face, while the measured joint hierarchy stays intact.
export class GuildLabForearms {
  readonly near: Phaser.GameObjects.Container;
  private far?: Phaser.GameObjects.Container;
  constructor(
    scene: Phaser.Scene,
    upper: GuildLabUpper,
    private rig: LabCharacterRig,
    draw: (index: number) => Phaser.GameObjects.Image | Phaser.GameObjects.Container,
  ) {
    this.near = scene.add
      .container(0, 0, [draw(1)])
      .setDepth(rig.cup.handLayer)
      .setVisible(false);
    upper.add(this.near);
    const cfg = rig.arms[0];
    if ("forearmLayer" in cfg) {
      this.far = scene.add.container(0, 0, [draw(0)]).setDepth(cfg.forearmLayer);
      upper.add(this.far);
    }
  }
  paint(
    arms: Arm[],
    active: (index: number) => boolean,
    raised: boolean,
    cup: Phaser.GameObjects.Image,
    body: Phaser.GameObjects.Container,
  ) {
    const cfg = this.rig.cup,
      depth = raised ? cfg.raisedLayer : cfg.layer;
    if (cup.depth !== depth) {
      cup.setDepth(depth);
      body.sort("depth");
    }
    this.near.setDepth(raised ? cfg.handLayer : cfg.restingHandLayer);
    this.place(this.near, arms[1], !active(1));
    if (this.far) this.place(this.far, arms[0], !active(0));
  }
  private place(drawing: Phaser.GameObjects.Container, arm: Arm, visible: boolean) {
    arm.lowerArtwork.visible = false;
    const length = arm.lower.y * arm.upper.scaleY;
    drawing
      .setVisible(visible)
      .setPosition(
        arm.upper.x - Math.sin(arm.upper.rotation) * length,
        arm.upper.y + Math.cos(arm.upper.rotation) * length,
      )
      .setRotation(arm.upper.rotation + arm.lower.rotation)
      .setScale(arm.upper.scaleY);
  }
}
