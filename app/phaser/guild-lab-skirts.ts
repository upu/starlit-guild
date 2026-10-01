import type Phaser from "phaser";
import type { LabCharacterRig } from "@/lib/guild-lab-rig";
import type { LabPose } from "@/lib/guild-lab-model";
import { LabSkirtMotion } from "@/lib/guild-lab-skirt";
import type { GuildLabUpper } from "./guild-lab-upper";

export class GuildLabSkirts {
  readonly front?: Phaser.GameObjects.Image;
  readonly back?: Phaser.GameObjects.Image;
  private motion?: LabSkirtMotion;
  private backAngle = 0;
  private last: number | null = null;
  private sizes: { width: number; height: number }[] = [];
  constructor(
    rig: LabCharacterRig,
    upper: GuildLabUpper,
    draw: (cfg: {
      frame: number;
      x: number;
      y: number;
      height: number;
      originX: number;
      originY: number;
      layer: number;
    }) => Phaser.GameObjects.Image,
  ) {
    if (!("skirt" in rig)) return;
    this.front = draw(rig.skirt);
    this.back = draw(rig.skirtBack);
    upper.add(this.front);
    upper.add(this.back);
    this.sizes = [this.front, this.back].map((p) => ({
      width: p.displayWidth,
      height: p.displayHeight,
    }));
    this.motion = new LabSkirtMotion(rig.skirt);
  }
  paint(time: number, mode: LabPose, angles: number[], reduced: boolean, jump: number) {
    if (!this.front || !this.back || !this.motion) return;
    const pose = this.motion.sample(time, mode, angles, reduced, jump),
      dt = this.last === null ? 0 : Math.max(0, Math.min(200, time - this.last));
    this.last = time;
    if (reduced || mode === "tea") this.backAngle = 0;
    else this.backAngle += (pose.rotation * 0.65 - this.backAngle) * Math.min(1, dt / 180);
    this.backAngle = Math.max(pose.rotation - 0.06, Math.min(pose.rotation + 0.06, this.backAngle));
    [this.front, this.back].forEach((p, i) => {
      p.rotation = i ? this.backAngle : pose.rotation;
      p.displayWidth = this.sizes[i].width * pose.width;
      p.displayHeight = this.sizes[i].height * pose.height;
    });
  }
}
