import type Phaser from "phaser";
import { guildLabArt } from "@/lib/guild-lab-art";
import { labRig, type LabLimbConfig } from "@/lib/guild-lab-rig";
import type { GuildLabFilter } from "./guild-lab-filter";
import {
  LAB_ACTOR_SCALE,
  labLegTarget,
  labJoint,
  labPose,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
const ASSET = "/guild/leon-parts-v2.webp";
type Limb = {
  upper: Phaser.GameObjects.Container;
  lower: Phaser.GameObjects.Container;
  config: LabLimbConfig;
};
export class GuildCutout {
  readonly root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private head: Phaser.GameObjects.Container;
  private cape: Phaser.GameObjects.Image;
  private shutEyes: Phaser.GameObjects.Image;
  private cup: Phaser.GameObjects.Image;
  private spoon: Phaser.GameObjects.Graphics;
  private legs: Limb[];
  private arms: Limb[];
  private joints: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    private filter: GuildLabFilter,
  ) {
    guildLabArt.frames.forEach(([x, y, w, h], i) =>
      scene.textures.get(ASSET).add(String(i), 0, x, y, w, h),
    );
    this.root = scene.add.container(0, 0);
    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.legs = [this.limb(labRig.legs[0])];
    this.arms = [this.limb(labRig.arms[0])];
    this.cape = this.part(
      labRig.cape.frame,
      labRig.cape.x,
      labRig.cape.y,
      labRig.cape.height,
      labRig.cape.originX,
      labRig.cape.originY,
    ).setDepth(labRig.cape.layer);
    this.body.add(this.cape);
    this.legs.push(this.limb(labRig.legs[1]));
    this.body.add(this.bodyPart(labRig.torso));
    this.body.add(this.bodyPart(labRig.scarf));
    this.head = scene.add.container(labRig.head.x, labRig.head.y).setDepth(labRig.head.layer);
    this.head.add(this.part(0, 0, 0, guildLabArt.head.displayHeight, 0.5, 1));
    this.shutEyes = this.blinkPatch();
    this.head.add(this.shutEyes);
    this.body.add(this.head);
    this.arms.push(this.limb(labRig.arms[1]));
    this.cup = this.part(labRig.cup.frame, 0, 0, labRig.cup.height, 0.5, 0).setDepth(
      labRig.cup.layer,
    );
    this.body.add(this.cup);
    this.body.sort("depth");
    this.spoon = scene.add.graphics().setPosition(0, 23);
    this.spoon.lineStyle(3, 0x79502c).lineBetween(0, 0, 8, 16);
    this.spoon.fillStyle(0xb88a50).fillEllipse(8, 16, 5, 8);
    this.arms[1].lower.add(this.spoon);
    this.joints = scene.add.graphics();
    this.root.add(this.joints);
  }
  private blinkPatch() {
    const [, , width, height] = guildLabArt.frames[0];
    const scale = guildLabArt.head.displayHeight / height;
    const [x, y, , patchHeight] = guildLabArt.head.blink.rect;
    return this.part(13, (x - width / 2) * scale, (y - height) * scale, patchHeight * scale, 0, 0);
  }
  private bodyPart(config: { frame: number; x: number; y: number; height: number; layer: number }) {
    return this.part(config.frame, config.x, config.y, config.height).setDepth(config.layer);
  }
  private part(frame: number, x: number, y: number, height: number, ox = 0.5, oy = 0.5) {
    const image = this.scene.add.image(x, y, ASSET, String(frame)).setOrigin(ox, oy);
    image.setDisplaySize((height * image.frame.width) / image.frame.height, height);
    return this.filter.add(image, LAB_ACTOR_SCALE);
  }
  private limb(config: LabLimbConfig) {
    const { frames, joint, lengths, overlap, front } = config;
    const top = this.scene.add.container(joint.x, joint.y).setDepth(config.layer);
    const bottom = this.scene.add.container(0, lengths[0]);
    const upper = this.segment(frames[0], lengths[0], overlap[0]);
    bottom.add(this.segment(frames[1], lengths[1], overlap[1]));
    top.add(front === "upper" ? [bottom, upper] : [upper, bottom]);
    this.body.add(top);
    return { upper: top, lower: bottom, config };
  }
  private segment(frame: number, length: number, overlap: readonly [number, number]) {
    return this.part(
      frame,
      0,
      -length * overlap[0],
      length * (1 + overlap[0] + overlap[1]),
      0.5,
      0,
    );
  }
  private aim(limb: Limb, target: Point) {
    const angles = labJoint(target, ...limb.config.lengths, limb.config.bend);
    limb.upper.rotation = angles.upper;
    limb.lower.rotation = angles.lower;
  }
  paint(time: number, mode: LabPose, reduced: boolean, debug: boolean) {
    const pose = labPose(time, mode, reduced);
    this.body.y = pose.bob;
    this.head.rotation = pose.head;
    this.cape.rotation = pose.cape;
    this.shutEyes.visible = pose.blink;
    this.cup.visible = mode === "tea";
    this.spoon.visible = mode === "work";
    this.arms.forEach((arm, i) => {
      this.aim(arm, i ? pose.hand : pose.farHand);
    });
    this.cup.setPosition(pose.cup.x, pose.cup.y).setRotation(pose.cup.angle);
    this.spoon.rotation = -this.arms[1].upper.rotation - this.arms[1].lower.rotation;
    this.legs.forEach((leg, i) => {
      this.aim(leg, labLegTarget(reduced ? 0 : time, i / 2, mode, pose.bob));
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
