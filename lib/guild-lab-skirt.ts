import type { LabPose } from "./guild-lab-model.ts";

type SkirtSettings = {
  follow: number;
  maxRotation: number;
  maxWidth: number;
  spring: number;
  damping: number;
};

/** A waist-fixed skirt follows the thighs with a damped delay, not a timed wiggle. */
export class LabSkirtMotion {
  private rotation = 0;
  private velocity = 0;
  private width = 1;
  private previousTime: number | null = null;
  private settings: SkirtSettings;
  constructor(settings: SkirtSettings) {
    this.settings = settings;
  }

  sample(time: number, mode: LabPose, thighs: readonly number[], reduced: boolean) {
    const cfg = this.settings;
    const delta =
      this.previousTime === null ? 0 : Math.max(0, Math.min(200, time - this.previousTime));
    this.previousTime = time;
    if (reduced || mode !== "walk") {
      this.rotation = this.velocity = 0;
      this.width = 1;
      return { rotation: 0, width: 1 };
    }
    const clamp = (value: number) => Math.max(-cfg.maxRotation, Math.min(cfg.maxRotation, value));
    const target = clamp(((thighs[0] + thighs[1]) / 2) * cfg.follow);
    const spread = Math.min(1, Math.abs(thighs[0] - thighs[1]));
    const targetWidth = 1 + (cfg.maxWidth - 1) * spread;
    // Short substeps keep the spring stable across low frame rates and paused captures.
    let remaining = delta / 1000;
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120);
      this.velocity += ((target - this.rotation) * cfg.spring - this.velocity * cfg.damping) * dt;
      this.rotation = clamp(this.rotation + this.velocity * dt);
      this.width += (targetWidth - this.width) * Math.min(1, dt * 10);
      remaining -= dt;
    }
    return { rotation: this.rotation, width: this.width };
  }
}
