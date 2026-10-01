import type Phaser from "phaser";
import type { LabCharacterArt } from "@/lib/guild-lab-characters";
import type { LabCharacterRig } from "@/lib/guild-lab-rig";
import { LAB_ACTOR_SCALE, type LabPose } from "@/lib/guild-lab-model";
import { labAnkle } from "@/lib/guild-lab-ankles";
import type { GuildLabFilter } from "./guild-lab-filter";

/** Shoes live in body coordinates; the shin rotation never tilts a planted sole. */
export class GuildLabFeet {
  readonly images: Phaser.GameObjects.Image[] = [];
  constructor(
    scene: Phaser.Scene,
    private body: Phaser.GameObjects.Container,
    filter: GuildLabFilter,
    private rig: LabCharacterRig,
    art: LabCharacterArt,
  ) {
    for (const cfg of rig.feet) {
      const frame = art.frames[cfg.frame];
      if (!frame) throw Error("Missing shoe frame");
      const [, , w, h] = frame;
      const image = scene.add
        .image(0, 0, art.asset, String(cfg.frame))
        .setOrigin(cfg.originX, cfg.originY)
        .setDisplaySize((w * cfg.height) / h, cfg.height)
        .setDepth(cfg.layer);
      filter.add(image, LAB_ACTOR_SCALE);
      body.add(image);
      this.images.push(image);
    }
  }
  paint(
    time: number,
    mode: LabPose,
    reduced: boolean,
    legs: { upper: Phaser.GameObjects.Container; lower: Phaser.GameObjects.Container }[],
    singles: Phaser.GameObjects.Container[],
  ) {
    const inverse = this.body.getWorldTransformMatrix();
    this.images.forEach((image, i) => {
      const ankle =
        this.rig.legStyle === "single" && mode !== "tea"
          ? singles[i].getWorldTransformMatrix().transformPoint(0, this.rig.singleLegs[i].length)
          : legs[i].lower.getWorldTransformMatrix().transformPoint(0, this.rig.legs[i].lengths[1]);
      const point = inverse.applyInverse(ankle.x, ankle.y),
        pose = labAnkle(time, i, mode, reduced);
      image
        .setPosition(point.x, point.y)
        .setRotation(
          pose.angle - (mode === "walk" && !reduced ? this.rig.feet[i].paintedSlope : 0),
        );
    });
  }
}
