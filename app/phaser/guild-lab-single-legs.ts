import type Phaser from "phaser";
import { labSingleLeg } from "@/lib/guild-lab-single-legs";
import type { LabCharacterArt } from "@/lib/guild-lab-characters";
import type { LabCharacterRig } from "@/lib/guild-lab-rig";
import type { LabPose } from "@/lib/guild-lab-model";
import { LAB_ACTOR_SCALE } from "@/lib/guild-lab-model";
import { labLimbArtwork } from "@/lib/guild-lab-limbs";
import type { GuildLabFilter } from "./guild-lab-filter";

export class GuildLabSingleLegs {
  readonly parts: Phaser.GameObjects.Container[] = [];
  private previous: LabPose = "tea";
  private started = -Infinity;
  private from: number[] = [];
  constructor(
    scene: Phaser.Scene,
    body: Phaser.GameObjects.Container,
    filter: GuildLabFilter,
    private rig: LabCharacterRig,
    art: LabCharacterArt,
  ) {
    if (rig.legStyle !== "single") return;
    for (const cfg of rig.singleLegs) {
      const images = [cfg.frame, cfg.bentFrame].map((frame) => {
        const d = labLimbArtwork(frame, cfg.length, art);
        const image = scene.add
          .image(0, 0, art.asset, String(frame))
          .setOrigin(d.originX, d.originY);
        image
          .setDisplaySize((d.height * image.frame.width) / image.frame.height, d.height)
          .setRotation(d.rotation);
        filter.add(image, LAB_ACTOR_SCALE);
        return image;
      });
      const pivot = scene.add.container(cfg.x, cfg.y, images).setDepth(cfg.layer);
      body.add(pivot);
      this.parts.push(pivot);
    }
  }
  paint(time: number, mode: LabPose, bob: number, reduced: boolean) {
    if (this.rig.legStyle !== "single") return [];
    if (this.previous === "walk" && mode !== "walk") {
      this.started = time;
      this.from = this.parts.map((p) => p.rotation);
    }
    const p =
      reduced || mode === "tea" ? 1 : Math.min(1, (time - this.started) / this.rig.idleSettleMs);
    this.parts.forEach((part, i) => {
      const cfg = this.rig.legStyle === "single" ? this.rig.singleLegs[i] : null;
      if (!cfg) return;
      const pose = labSingleLeg(time, i, mode, bob, reduced, this.rig);
      part.list.forEach((child, j) =>
        (child as Phaser.GameObjects.Image).setVisible(j === (pose.bent ? 1 : 0)),
      );
      part
        .setVisible(mode !== "tea")
        .setPosition(cfg.x, cfg.y + pose.lift)
        .setScale(1, pose.scaleY);
      part.rotation =
        mode === "walk" || p >= 1
          ? pose.rotation
          : this.from[i] + (pose.rotation - this.from[i]) * p * p * (3 - 2 * p);
    });
    this.previous = mode;
    return this.parts.map((part) => part.rotation);
  }
  debug(joints: Phaser.GameObjects.Graphics, root: Phaser.GameObjects.Components.TransformMatrix) {
    this.parts.forEach((part, i) => {
      if (!part.visible || this.rig.legStyle !== "single") return;
      const m = part.getWorldTransformMatrix(),
        cfg = this.rig.singleLegs[i];
      const start = root.applyInverse(m.tx, m.ty),
        end = m.transformPoint(0, cfg.length);
      const finish = root.applyInverse(end.x, end.y);
      joints.lineBetween(start.x, start.y, finish.x, finish.y).strokeCircle(start.x, start.y, 2);
    });
  }
}
