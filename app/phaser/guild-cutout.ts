import type Phaser from "phaser";
import { guildLabArt } from "@/lib/guild-lab-art";
import { labLimbPaintOrder, labRig, type LabLimbConfig } from "@/lib/guild-lab-rig";
import type { GuildLabFilter } from "./guild-lab-filter";
import { GuildLabFace } from "./guild-lab-face";
import { GuildLabEffects } from "./guild-lab-effects";
import type { LabFeeling } from "@/lib/guild-lab-affection";
import { labArmArtwork, LabArmMotion } from "@/lib/guild-lab-arms";
import {
  LAB_ACTOR_SCALE,
  labLegTarget,
  labJoint,
  labPose,
  labTeaCup,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
const ASSET = guildLabArt.asset;
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
  private face: GuildLabFace;
  private effects: GuildLabEffects;
  private cup: Phaser.GameObjects.Image;
  private spoon: Phaser.GameObjects.Graphics;
  private legs: Limb[];
  private arms: Limb[];
  private armMotion = [new LabArmMotion(), new LabArmMotion()];
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
    this.face = new GuildLabFace(scene, this.head, filter);
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
    this.effects = new GuildLabEffects(scene, this.root);
  }
  hit(point: Point) {
    return this.body.getBounds().contains(point.x, point.y);
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
    const { frames, joint, lengths, front } = config;
    const top = this.scene.add.container(joint.x, joint.y).setDepth(config.layer);
    const bottom = this.scene.add.container(0, lengths[0]);
    const segment = (i: 0 | 1) =>
      config.measured
        ? this.armSegment(frames[i], lengths[i])
        : this.segment(frames[i], lengths[i], config.overlap[i]);
    const upper = segment(0);
    bottom.add(segment(1));
    top.add(labLimbPaintOrder(front).map((part) => (part === "upper" ? upper : bottom)));
    this.body.add(top);
    return { upper: top, lower: bottom, config };
  }
  private armSegment(frame: number, length: number) {
    const art = labArmArtwork(frame, length);
    return this.part(frame, 0, 0, art.height, art.originX, art.originY).setRotation(art.rotation);
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
  paint(
    time: number,
    mode: LabPose,
    reduced: boolean,
    debug: boolean,
    feeling: LabFeeling,
    paused: boolean,
  ) {
    const pose = labPose(time, mode, reduced);
    this.body.y = pose.bob - feeling.jump;
    this.body.setScale(
      1 + feeling.squash * 0.06,
      1 - feeling.squash * 0.08 + feeling.stretch * 0.035,
    );
    this.head.rotation = pose.head + feeling.look;
    this.cape.rotation = pose.cape;
    this.face.paint(feeling, pose.blink);
    this.cup.visible = mode === "tea";
    this.spoon.visible = mode === "work";
    const cup = labTeaCup(pose.sip, this.head.rotation);
    this.paintArms(time, mode, reduced, feeling, [
      pose.farHand,
      mode === "tea" ? cup.hand : pose.hand,
    ]);
    this.cup.setPosition(cup.x, cup.y).setRotation(cup.angle);
    this.spoon.rotation = -this.arms[1].upper.rotation - this.arms[1].lower.rotation;
    this.legs.forEach((leg, i) => {
      this.aim(leg, labLegTarget(reduced ? 0 : time, i / 2, mode, pose.bob));
    });
    this.debug(debug);
    this.effects.paint(
      time,
      mode,
      feeling,
      reduced,
      paused,
      { x: cup.x, y: cup.y + this.body.y },
      this.root.scaleX < 0,
    );
  }
  private paintArms(
    time: number,
    mode: LabPose,
    reduced: boolean,
    feeling: LabFeeling,
    targets: Point[],
  ) {
    const reaction = feeling.stretch > 0 || feeling.jump > 0 || feeling.squash > 0;
    this.arms.forEach((arm, i) => {
      const target = targets[i];
      const angles = this.armMotion[i].sample(
        time,
        mode,
        i,
        {
          x: target.x * (1 - feeling.stretch),
          y: target.y * (1 - feeling.stretch) - 32 * feeling.stretch,
        },
        reaction,
        reduced,
      );
      arm.upper.setRotation(angles.upper).setScale(angles.scale);
      arm.lower.rotation = angles.lower;
    });
  }
  private debug(show: boolean) {
    this.joints.clear();
    if (!show) return;
    this.joints.lineStyle(1, 0x78fff1, 0.9);
    for (const limb of [...this.arms, ...this.legs]) {
      const x = limb.upper.x,
        y = limb.upper.y + this.body.y;
      const dx = -Math.sin(limb.upper.rotation) * limb.lower.y * limb.upper.scaleY;
      const dy = Math.cos(limb.upper.rotation) * limb.lower.y * limb.upper.scaleY;
      this.joints
        .lineBetween(x, y, x + dx, y + dy)
        .strokeCircle(x, y, 2)
        .strokeCircle(x + dx, y + dy, 2);
    }
  }
}
