import type Phaser from "phaser";
import { labCharacters } from "@/lib/guild-lab-characters";
import { labLimbPaintOrder, type LabCharacterId, type LabLimbConfig } from "@/lib/guild-lab-rig";
import type { GuildLabFilter } from "./guild-lab-filter";
import { GuildLabFace } from "./guild-lab-face";
import { GuildLabEffects } from "./guild-lab-effects";
import type { LabFeeling } from "@/lib/guild-lab-affection";
import { LabArmMotion } from "@/lib/guild-lab-arms";
import { labLimbArtwork } from "@/lib/guild-lab-limbs";
import {
  LAB_ACTOR_SCALE,
  labLegTarget,
  labJoint,
  labPose,
  labTeaCup,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
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
  private art;
  private rig;
  private backHair?: Phaser.GameObjects.Image;
  private skirt?: Phaser.GameObjects.Image;
  private previousMode: LabPose = "tea";
  private idleStartedAt = -Infinity;
  private lastBob = 0;
  private idleFromBob = 0;
  constructor(
    private scene: Phaser.Scene,
    private filter: GuildLabFilter,
    readonly character: LabCharacterId = "leon",
  ) {
    const profile = labCharacters[character];
    this.art = profile.art;
    this.rig = profile.rig;
    this.armMotion = [new LabArmMotion(this.rig), new LabArmMotion(this.rig)];
    this.art.frames.forEach(([x, y, w, h], i) => {
      const texture = scene.textures.get(this.art.asset);
      if (!texture.has(String(i))) texture.add(String(i), 0, x, y, w, h);
    });
    this.root = scene.add.container(0, 0);
    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.legs = [this.limb(this.rig.legs[0])];
    this.arms = [this.limb(this.rig.arms[0])];
    if (character === "aria") {
      const cfg = labCharacters.aria.rig.backHair;
      this.backHair = this.bodyPart(cfg).setDepth(cfg.layer);
      this.body.add(this.backHair);
    }
    this.cape = this.part(
      this.rig.cape.frame,
      this.rig.cape.x,
      this.rig.cape.y,
      this.rig.cape.height,
      this.rig.cape.originX,
      this.rig.cape.originY,
    ).setDepth(this.rig.cape.layer);
    this.body.add(this.cape);
    this.legs.push(this.limb(this.rig.legs[1]));
    this.body.add(this.bodyPart(this.rig.torso));
    if (character === "aria") {
      const cfg = labCharacters.aria.rig.skirt;
      this.skirt = this.bodyPart(cfg).setDepth(cfg.layer);
      this.body.add(this.skirt);
    }
    this.body.add(this.bodyPart(this.rig.scarf));
    this.head = scene.add.container(this.rig.head.x, this.rig.head.y).setDepth(this.rig.head.layer);
    this.head.add(this.part(0, 0, 0, this.art.head.displayHeight, 0.5, 1));
    this.face = new GuildLabFace(scene, this.head, filter, this.art);
    this.body.add(this.head);
    this.arms.push(this.limb(this.rig.arms[1]));
    this.cup = this.part(this.rig.cup.frame, 0, 0, this.rig.cup.height, 0.5, 0).setDepth(
      this.rig.cup.layer,
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
    const image = this.scene.add.image(x, y, this.art.asset, String(frame)).setOrigin(ox, oy);
    image.setDisplaySize((height * image.frame.width) / image.frame.height, height);
    return this.filter.add(image, LAB_ACTOR_SCALE);
  }
  private limb(config: LabLimbConfig) {
    const { frames, joint, lengths, front } = config;
    const top = this.scene.add.container(joint.x, joint.y).setDepth(config.layer);
    const bottom = this.scene.add.container(0, lengths[0]);
    const segment = (i: 0 | 1) =>
      config.measured
        ? this.measuredSegment(frames[i], lengths[i])
        : this.segment(frames[i], lengths[i], config.overlap[i]);
    const upper = segment(0);
    bottom.add(segment(1));
    top.add(labLimbPaintOrder(front).map((part) => (part === "upper" ? upper : bottom)));
    this.body.add(top);
    return { upper: top, lower: bottom, config };
  }
  private measuredSegment(frame: number, length: number) {
    const art = labLimbArtwork(frame, length, this.art);
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
  private pose(time: number, mode: LabPose, reduced: boolean) {
    if (this.previousMode === "walk" && mode === "idle") {
      this.idleStartedAt = time;
      this.idleFromBob = this.lastBob;
    }
    const transition = reduced
      ? 1
      : Math.max(0, Math.min(1, (time - this.idleStartedAt) / this.rig.idleSettleMs));
    const pose = labPose(
      time,
      mode,
      reduced,
      transition,
      this.idleFromBob,
      this.rig,
      this.art,
      this.character === "aria" && mode === "tea" ? 1200 : 0,
    );
    this.lastBob = pose.bob;
    this.previousMode = mode;
    return pose;
  }
  private ornaments(time: number, mode: LabPose, reduced: boolean) {
    if (this.backHair) this.backHair.rotation = reduced ? 0 : Math.sin(time / 640) * 0.025;
    if (this.skirt)
      this.skirt.rotation = reduced ? 0 : Math.sin(time / 300) * (mode === "walk" ? 0.035 : 0.01);
  }
  private nearHand(
    mode: LabPose,
    cupHand: Point,
    defaultHand: Point,
    interaction: (Point & { amount: number }) | null,
  ): Point {
    if (!interaction) return mode === "tea" ? cupHand : defaultHand;
    return {
      x: cupHand.x + (interaction.x - cupHand.x) * interaction.amount,
      y: cupHand.y + (interaction.y - cupHand.y) * interaction.amount,
    };
  }
  paint(
    time: number,
    mode: LabPose,
    reduced: boolean,
    debug: boolean,
    feeling: LabFeeling,
    paused: boolean,
    interactionHand: (Point & { amount: number }) | null = null,
  ) {
    const pose = this.pose(time, mode, reduced);
    this.body.y = pose.bob - feeling.jump;
    this.body.setScale(
      1 + feeling.squash * 0.06,
      1 - feeling.squash * 0.08 + feeling.stretch * 0.035,
    );
    this.head.rotation = pose.head + feeling.look;
    this.cape.rotation = pose.cape;
    this.ornaments(time, mode, reduced);
    this.face.paint(feeling, pose.blink);
    const reach = interactionHand?.amount ?? 0;
    this.cup.visible = mode === "tea" && reach < 1;
    this.cup.setAlpha(1 - reach);
    this.spoon.visible = mode === "work";
    const cup = labTeaCup(pose.sip, this.head.rotation, this.rig, this.art);
    this.paintArms(time, mode, reduced, feeling, [
      pose.farHand,
      this.nearHand(mode, cup.hand, pose.hand, interactionHand),
    ]);
    this.cup.setPosition(cup.x, cup.y).setRotation(cup.angle);
    this.spoon.rotation = -this.arms[1].upper.rotation - this.arms[1].lower.rotation;
    this.legs.forEach((leg, i) => {
      this.aim(leg, labLegTarget(reduced ? 0 : time, i / 2, mode, pose.bob, this.rig));
    });
    this.debug(debug);
    this.effects.paint(
      time,
      reach > 0.5 ? "idle" : mode,
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
