import type Phaser from "phaser";
import { labCharacters } from "@/lib/guild-lab-characters";
import { labLimbPaintOrder, type LabCharacterId, type LabLimbConfig } from "@/lib/guild-lab-rig";
import type { GuildLabFilter } from "./guild-lab-filter";
import { GuildLabFace } from "./guild-lab-face";
import { GuildLabEffects } from "./guild-lab-effects";
import { GuildLabSingleLegs } from "./guild-lab-single-legs";
import { GuildLabBentArms } from "./guild-lab-bent-arms";
import { drawLabJoints } from "./guild-lab-joints";
import { GuildLabFeet } from "./guild-lab-feet";
import { GuildLabSkirts } from "./guild-lab-skirts";
import { GuildLabForearms } from "./guild-lab-forearms";
import { GuildLabUpper } from "./guild-lab-upper";
import type { LabFeeling } from "@/lib/guild-lab-affection";
import { LabArmMotion } from "@/lib/guild-lab-arms";
import { labLimbArtwork } from "@/lib/guild-lab-limbs";
import { LabFeetMotion } from "@/lib/guild-lab-feet";
import { labArtOrigin } from "@/lib/guild-lab-art-layout";
import {
  LAB_ACTOR_SCALE,
  labJoint,
  labHip,
  labPose,
  labTeaCup,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
type Limb = {
  upper: Phaser.GameObjects.Container;
  lower: Phaser.GameObjects.Container;
  config: LabLimbConfig;
  lowerArtwork: Phaser.GameObjects.Image | Phaser.GameObjects.Container;
};
export class GuildCutout {
  readonly root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private upperMotion: GuildLabUpper;
  private singleLegs!: GuildLabSingleLegs;
  private bentArms: GuildLabBentArms;
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
  private hairLocks: Phaser.GameObjects.Image[] = [];
  private skirt?: Phaser.GameObjects.Image;
  private skirts!: GuildLabSkirts;
  private shoes: GuildLabFeet;
  private forearms: GuildLabForearms;
  private get raisedForearm() {
    return this.forearms.near;
  }
  private previousMode: LabPose = "tea";
  private idleStartedAt = -Infinity;
  private lastBob = 0;
  private idleFromBob = 0;
  private feetMotion;
  constructor(
    private scene: Phaser.Scene,
    private filter: GuildLabFilter,
    readonly character: LabCharacterId = "leon",
  ) {
    const profile = labCharacters[character];
    this.art = profile.art;
    this.rig = profile.rig;
    this.feetMotion = new LabFeetMotion(this.rig);
    this.armMotion = [new LabArmMotion(this.rig), new LabArmMotion(this.rig)];
    this.registerFrames();
    this.root = scene.add.container(0, 0);
    this.body = scene.add.container(0, 0);
    this.upperMotion = new GuildLabUpper(scene, this.body, this.rig.walk.pivotY);
    this.root.add(this.body);
    this.legs = [this.limb(this.rig.legs[0])];
    this.arms = [this.limb(this.rig.arms[0], true)];
    this.addHair();
    this.cape = this.part(
      this.rig.cape.frame,
      this.rig.cape.x,
      this.rig.cape.y,
      this.rig.cape.height,
      this.rig.cape.originX,
      this.rig.cape.originY,
    ).setDepth(this.rig.cape.layer);
    this.upperMotion.add(this.cape);
    this.legs.push(this.limb(this.rig.legs[1]));
    this.singleLegs = new GuildLabSingleLegs(scene, this.body, filter, this.rig, this.art);
    this.shoes = new GuildLabFeet(scene, this.body, filter, this.rig, this.art);
    this.upperMotion.add(this.bodyPart(this.rig.torso));
    this.addSkirt();
    const neck = this.rig.neckBase;
    this.upperMotion.add(
      scene.add.ellipse(neck.x, neck.y, neck.width, neck.height, neck.color).setDepth(neck.layer),
    );
    this.upperMotion.add(this.bodyPart(this.rig.scarf));
    this.head = scene.add.container(this.rig.head.x, this.rig.head.y).setDepth(this.rig.head.layer);
    this.head.add(this.part(0, 0, 0, this.art.head.displayHeight, 0.5, 1));
    this.face = new GuildLabFace(scene, this.head, filter, this.art);
    this.upperMotion.add(this.head);
    this.arms.push(this.limb(this.rig.arms[1], true));
    this.bentArms = new GuildLabBentArms(scene, this.upperMotion, filter, this.art, this.rig);
    this.cup = this.part(
      this.rig.cup.frame,
      0,
      0,
      this.rig.cup.height,
      0.5,
      labArtOrigin(this.art, this.rig.cup.frame, 3, 0),
    ).setDepth(this.rig.cup.layer);
    this.upperMotion.add(this.cup);
    this.forearms = this.createForearms();
    this.body.sort("depth");
    this.spoon = this.createSpoon();
    this.joints = scene.add.graphics();
    this.root.add(this.joints);
    this.effects = new GuildLabEffects(scene, this.root);
  }
  private registerFrames() {
    this.art.frames.forEach(([x, y, w, h], i) => {
      const texture = this.scene.textures.get(this.art.asset);
      if (!texture.has(String(i))) texture.add(String(i), 0, x, y, w, h);
    });
  }
  private createForearms() {
    return new GuildLabForearms(this.scene, this.upperMotion, this.rig, (i) => {
      const arm = this.rig.arms[i];
      return this.measuredSegment(arm.frames[1], arm.lengths[1], arm.thickness);
    });
  }
  private addSkirt() {
    this.skirts = new GuildLabSkirts(this.rig, this.upperMotion, (cfg) =>
      this.part(cfg.frame, cfg.x, cfg.y, cfg.height, cfg.originX, cfg.originY).setDepth(cfg.layer),
    );
    this.skirt = this.skirts.front;
  }
  private addHair() {
    if (this.character !== "aria") return;
    for (const cfg of labCharacters.aria.rig.hairLocks) {
      const image = this.part(
        cfg.frame,
        cfg.x,
        cfg.y,
        cfg.height,
        cfg.originX,
        cfg.originY,
      ).setDepth(cfg.layer);
      this.hairLocks.push(image);
      this.upperMotion.add(image);
    }
  }
  private createSpoon() {
    const spoon = this.scene.add.graphics().setPosition(0, 23);
    spoon.lineStyle(3, 0x79502c).lineBetween(0, 0, 8, 16);
    spoon.fillStyle(0xb88a50).fillEllipse(8, 16, 5, 8);
    this.arms[1].lower.add(spoon);
    return spoon;
  }
  hit(point: Point) {
    return this.body.getBounds().contains(point.x, point.y);
  }
  bounds() {
    return this.body.getBounds();
  }
  private bodyPart(config: {
    frame: number;
    x: number;
    y: number;
    height: number;
    layer: number;
    originX?: number;
    originY?: number;
  }) {
    return this.part(
      config.frame,
      config.x,
      config.y,
      config.height,
      config.originX,
      config.originY,
    ).setDepth(config.layer);
  }
  private part(frame: number, x: number, y: number, height: number, ox = 0.5, oy = 0.5) {
    const image = this.scene.add.image(x, y, this.art.asset, String(frame)).setOrigin(ox, oy);
    image.setDisplaySize((height * image.frame.width) / image.frame.height, height);
    return this.filter.add(image, LAB_ACTOR_SCALE);
  }
  private limb(config: LabLimbConfig, upperBody = false) {
    const { frames, joint, lengths, front } = config;
    const top = this.scene.add.container(joint.x, joint.y).setDepth(config.layer);
    const bottom = this.scene.add.container(0, lengths[0]);
    const thickness =
      typeof config.thickness === "number"
        ? [config.thickness, config.thickness]
        : (config.thickness ?? [1, 1]);
    const segment = (i: 0 | 1) =>
      config.measured
        ? this.measuredSegment(frames[i], lengths[i], thickness[i])
        : this.segment(frames[i], lengths[i], config.overlap[i]);
    const upper = segment(0);
    const lowerArtwork = segment(1);
    bottom.add(lowerArtwork);
    top.add(labLimbPaintOrder(front).map((part) => (part === "upper" ? upper : bottom)));
    if (upperBody) this.upperMotion.add(top);
    else this.body.add(top);
    return { upper: top, lower: bottom, config, lowerArtwork };
  }
  private measuredSegment(frame: number, length: number, thickness: number) {
    const art = labLimbArtwork(frame, length, this.art);
    const image = this.part(frame, 0, 0, art.height, art.originX, art.originY).setRotation(
      art.rotation,
    );
    if (thickness === 1) return image;
    // Apply width AFTER aligning the painted bone; neither endpoint can move.
    return this.scene.add.container(0, 0, [image]).setScale(thickness, 1);
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
  private aim(limb: Limb, target: Point, idle = false) {
    const bend =
      idle && "idleBend" in limb.config ? Number(limb.config.idleBend) : limb.config.bend;
    const angles = labJoint(target, ...limb.config.lengths, bend);
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
  private ornaments(time: number, reduced: boolean) {
    this.hairLocks.forEach((hair, i) => {
      const cfg = labCharacters.aria.rig.hairLocks[i];
      hair.rotation = reduced ? 0 : Math.sin(time / 640 + cfg.phase) * cfg.sway;
    });
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
    this.ornaments(time, reduced);
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
    this.forearms.paint(
      this.arms,
      (i) => this.bentArms.active(i),
      mode === "tea" && pose.sip > 0.4 && reach < 1,
      this.cup,
      this.body,
    );
    this.spoon.rotation = -this.arms[1].upper.rotation - this.arms[1].lower.rotation;
    this.paintLegs(time, mode, pose.bob, reduced, feeling.jump);
    this.upperMotion.paint(pose.lean);
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
  private paintLegs(time: number, mode: LabPose, bob: number, reduced: boolean, jump: number) {
    const feet = this.feetMotion.sample(time, mode, bob, reduced);
    this.legs.forEach((leg, i) => {
      const hip = labHip(i, mode, this.rig);
      leg.upper.setPosition(hip.x, hip.y);
      this.aim(leg, feet[i], mode === "idle");
      leg.upper.visible = this.rig.legStyle !== "single" || mode === "tea";
    });
    const singleAngles = this.singleLegs.paint(time, mode, bob, reduced);
    this.skirts.paint(
      time,
      mode,
      singleAngles.length && mode !== "tea"
        ? singleAngles
        : this.legs.map((leg) => leg.upper.rotation),
      reduced,
      jump,
    );
    this.shoes.paint(time, mode, reduced, this.legs, this.singleLegs.parts);
  }
  private paintArms(
    time: number,
    mode: LabPose,
    reduced: boolean,
    feeling: LabFeeling,
    targets: Point[],
  ) {
    const reaction = feeling.jump > 0 || feeling.squash > 0;
    this.arms.forEach((arm, i) => {
      const target = targets[i];
      const angles = this.armMotion[i].sample(
        time,
        mode,
        i,
        target,
        reaction,
        reduced,
        feeling.stretch,
      );
      arm.upper.setRotation(angles.upper).setScale(angles.scale);
      arm.lower.rotation = angles.lower;
    });
    this.bentArms.paint(this.arms, mode === "tea" && this.cup.visible);
  }
  private debug(show: boolean) {
    this.joints.clear();
    if (!show) return;
    const root = this.root.getWorldTransformMatrix();
    drawLabJoints(this.joints, root, [...this.arms, ...this.legs]);
    this.singleLegs.debug(this.joints, root);
    this.bentArms.debug(this.joints, root);
  }
}
