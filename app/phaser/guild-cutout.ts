import type Phaser from "phaser";
import { guildLabArt } from "@/lib/guild-lab-art";
import {
  labFace,
  labFoot,
  labJoint,
  labPose,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
const ASSET = "/guild/leon-parts-v1.webp";
type Limb = { upper: Phaser.GameObjects.Container; lower: Phaser.GameObjects.Container };
export class GuildCutout {
  readonly root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private head: Phaser.GameObjects.Container;
  private cape: Phaser.GameObjects.Image;
  private eyes: Phaser.GameObjects.Image;
  private shutEyes: Phaser.GameObjects.Image;
  private cup: Phaser.GameObjects.Image;
  private spoon: Phaser.GameObjects.Graphics;
  private legs: Limb[];
  private arms: Limb[];
  private joints: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    guildLabArt.frames.forEach(([x, y, w, h], i) =>
      scene.textures.get(ASSET).add(String(i), 0, x, y, w, h),
    );
    this.root = scene.add.container(0, 0);
    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.cape = this.part(3, 0, -84, 62, 0.86, 0.08);
    this.body.add(this.cape);
    this.legs = [this.limb(8, 9, 10, -43, 22, 27), this.limb(10, 11, -9, -43, 22, 27)];
    this.arms = [this.limb(4, 5, 17, -81, 23, 25)];
    this.body.add(this.part(2, 0, -67, 51));
    this.body.add(this.part(1, -4, -88, 19));
    this.head = scene.add.container(3, -91);
    this.head.add(this.part(0, 0, 0, 90, 0.5, 1));
    this.eyes = this.part(12, labFace.eyes.x, labFace.eyes.y, 14);
    this.shutEyes = this.part(13, labFace.eyes.x, labFace.eyes.y - 2, 9.5);
    this.head.add([this.eyes, this.shutEyes, this.part(14, labFace.mouth.x, labFace.mouth.y, 2.3)]);
    this.body.add(this.head);
    this.arms.push(this.limb(6, 7, -18, -80, 23, 25));
    this.cup = this.part(15, 0, 0, 17, 0.5, 0);
    this.body.add(this.cup);
    this.spoon = scene.add.graphics().setPosition(0, 23);
    this.spoon.lineStyle(3, 0x79502c).lineBetween(0, 0, 8, 16);
    this.spoon.fillStyle(0xb88a50).fillEllipse(8, 16, 5, 8);
    this.arms[1].lower.add(this.spoon);
    this.joints = scene.add.graphics();
    this.root.add(this.joints);
  }
  private part(frame: number, x: number, y: number, height: number, ox = 0.5, oy = 0.5) {
    const image = this.scene.add.image(x, y, ASSET, String(frame)).setOrigin(ox, oy);
    return image.setDisplaySize((height * image.frame.width) / image.frame.height, height);
  }
  private limb(a: number, b: number, x: number, y: number, upper: number, lower: number) {
    const top = this.scene.add.container(x, y);
    const bottom = this.scene.add.container(0, upper);
    top.add(this.part(a, 0, -4, upper + 9, 0.5, 0));
    bottom.add(this.part(b, 0, -5, lower + 9, 0.5, 0));
    top.add(bottom);
    this.body.add(top);
    return { upper: top, lower: bottom };
  }
  private aim(limb: Limb, target: Point, upper: number, lower: number, bend = 1) {
    const angles = labJoint(target, upper, lower, bend);
    limb.upper.rotation = angles.upper;
    limb.lower.rotation = angles.lower;
  }
  paint(time: number, mode: LabPose, reduced: boolean, debug: boolean) {
    const pose = labPose(time, mode, reduced);
    this.body.y = pose.bob;
    this.head.rotation = pose.head;
    this.cape.rotation = pose.cape;
    this.eyes.visible = !pose.blink;
    this.shutEyes.visible = pose.blink;
    this.cup.visible = mode === "tea";
    this.spoon.visible = mode === "work";
    this.arms.forEach((arm, i) => {
      this.aim(arm, i ? pose.hand : { x: 8, y: 40 }, 23, 25);
    });
    this.cup.setPosition(pose.cup.x, pose.cup.y).setRotation(pose.cup.angle);
    this.spoon.rotation = -this.arms[1].upper.rotation - this.arms[1].lower.rotation;
    this.legs.forEach((leg, i) => {
      const foot = mode === "walk" ? labFoot(reduced ? 0 : time, i / 2) : { x: 2, y: 0 };
      const target = mode === "tea" ? { x: 22, y: 25 } : { x: foot.x, y: 43 + foot.y - pose.bob };
      this.aim(leg, target, 22, 27, -1);
    });
    this.debug(debug);
  }
  private debug(show: boolean) {
    this.joints.clear();
    if (!show) return;
    this.joints.lineStyle(1, 0x78fff1, 0.9);
    for (const limb of [...this.arms, ...this.legs]) {
      const x = limb.upper.x,
        y = limb.upper.y + this.body.y;
      const dx = -Math.sin(limb.upper.rotation) * limb.lower.y;
      const dy = Math.cos(limb.upper.rotation) * limb.lower.y;
      this.joints
        .lineBetween(x, y, x + dx, y + dy)
        .strokeCircle(x, y, 2)
        .strokeCircle(x + dx, y + dy, 2);
    }
  }
}
