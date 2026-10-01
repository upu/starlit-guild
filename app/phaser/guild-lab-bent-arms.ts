import type Phaser from "phaser";
import type { LabCharacterArt } from "@/lib/guild-lab-characters";
import type { LabCharacterRig } from "@/lib/guild-lab-rig";
import { labBentArm } from "@/lib/guild-lab-bent-arms";
import { LAB_ACTOR_SCALE } from "@/lib/guild-lab-model";
import type { GuildLabFilter } from "./guild-lab-filter";
import type { GuildLabUpper } from "./guild-lab-upper";

export class GuildLabBentArms {
  private shown = [false, false];
  private parts: {
    side: number;
    frame: number;
    body: Phaser.GameObjects.Container;
    front: Phaser.GameObjects.Container;
  }[] = [];
  constructor(
    scene: Phaser.Scene,
    upper: GuildLabUpper,
    filter: GuildLabFilter,
    private art: LabCharacterArt,
    private rig: LabCharacterRig,
  ) {
    if (!("variants" in art)) return;
    for (const variant of art.variants.filter((p) => p.kind === "arm")) {
      const cfg = rig.arms[variant.side],
        length = cfg.lengths[0] + cfg.lengths[1];
      const draw = (frame: number) => {
        const [, , w, h] = art.frames[frame];
        const image = scene.add
          .image(0, 0, art.asset, String(frame))
          .setOrigin(variant.root[0] / w, variant.root[1] / h);
        const scale =
          length / Math.hypot(variant.end[0] - variant.root[0], variant.end[1] - variant.root[1]);
        image.setDisplaySize(w * scale, h * scale);
        filter.add(image, LAB_ACTOR_SCALE);
        const part = scene.add
          .container(cfg.joint.x, cfg.joint.y, [image])
          .setDepth(cfg.layer)
          .setVisible(false);
        upper.add(part);
        return part;
      };
      this.parts.push({
        side: variant.side,
        frame: variant.frame,
        body: draw(variant.frame),
        front: draw(variant.forearmFrame),
      });
    }
  }
  paint(
    arms: { upper: Phaser.GameObjects.Container; lower: Phaser.GameObjects.Container }[],
    raised: boolean,
  ) {
    this.shown = [false, false];
    for (const [i, arm] of arms.entries()) {
      const pose = labBentArm(
        this.art,
        i,
        arm.upper.rotation,
        arm.lower.rotation,
        this.rig.arms[i].lengths,
        arm.upper.scaleY,
      );
      this.shown[i] = Boolean(pose);
      arm.upper.visible = !pose;
      this.updateSide(i, pose, raised);
    }
  }
  active(index: number) {
    return this.shown[index];
  }
  private updateSide(index: number, pose: ReturnType<typeof labBentArm>, raised: boolean) {
    for (const part of this.parts.filter((p) => p.side === index)) {
      const visible = pose?.variant.frame === part.frame;
      part.body.setVisible(visible);
      const cfg = this.rig.arms[index];
      const foreground = "forearmLayer" in cfg ? cfg.forearmLayer : undefined;
      part.front.setVisible(visible && ((raised && index === 1) || foreground !== undefined));
      if (!pose) continue;
      part.body.setRotation(pose.rotation).setScale(pose.scale);
      part.front
        .setRotation(pose.rotation)
        .setScale(pose.scale)
        .setDepth(raised && index === 1 ? 9.2 : (foreground ?? cfg.layer));
    }
  }
  private points(index: number) {
    const part = this.parts.find((p) => p.side === index && p.body.visible);
    if (!part || !("variants" in this.art)) return [];
    const v = this.art.variants.find((v) => v.frame === part.frame);
    if (!v) return [];
    const cfg = this.rig.arms[index],
      s =
        (cfg.lengths[0] + cfg.lengths[1]) / Math.hypot(v.end[0] - v.root[0], v.end[1] - v.root[1]);
    const matrix = part.body.getWorldTransformMatrix();
    return [v.root, v.hinge, v.end].map((p) =>
      matrix.transformPoint((p[0] - v.root[0]) * s, (p[1] - v.root[1]) * s),
    );
  }
  debug(joints: Phaser.GameObjects.Graphics, root: Phaser.GameObjects.Components.TransformMatrix) {
    for (const index of [0, 1]) {
      const points = this.points(index).map((p) => root.applyInverse(p.x, p.y));
      if (!points.length) continue;
      points.forEach((p) => joints.strokeCircle(p.x, p.y, 2));
      for (let i = 1; i < points.length; i++)
        joints.lineBetween(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }
  }
  contact(index: number) {
    return this.points(index)[2] ?? null;
  }
}
