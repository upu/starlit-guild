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
  private height = 1;
  private heightVelocity = 0;
  private previousTime: number | null = null;
  private settings: SkirtSettings;
  constructor(settings: SkirtSettings) {
    this.settings = settings;
  }

  sample(time: number, mode: LabPose, thighs: readonly number[], reduced: boolean, jump = 0) {
    const cfg = this.settings;
    const delta =
      this.previousTime === null ? 0 : Math.max(0, Math.min(200, time - this.previousTime));
    this.previousTime = time;
    if (reduced || mode === "tea") {
      this.rotation = this.velocity = 0;
      this.width = 1;
      this.height = 1;
      this.heightVelocity = 0;
      return { rotation: 0, width: 1, height: 1 };
    }
    const clamp = (value: number) => Math.max(-cfg.maxRotation, Math.min(cfg.maxRotation, value));
    const target = mode === "walk" ? clamp(((thighs[0] + thighs[1]) / 2) * cfg.follow) : 0;
    const spread = Math.min(1, Math.abs(thighs[0] - thighs[1]));
    const targetWidth = mode === "walk" ? 1 + (cfg.maxWidth - 1) * spread : 1;
    const targetHeight =
      1 +
      (mode === "walk" ? Math.cos((time / 450) * Math.PI * 2) * 0.025 : 0) -
      Math.min(0.03, jump * 0.005);
    // Short substeps keep the spring stable across low frame rates and paused captures.
    let remaining = delta / 1000;
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120);
      this.velocity += ((target - this.rotation) * cfg.spring - this.velocity * cfg.damping) * dt;
      this.rotation = clamp(this.rotation + this.velocity * dt);
      this.width += (targetWidth - this.width) * Math.min(1, dt * 10);
      this.heightVelocity +=
        ((targetHeight - this.height) * cfg.spring - this.heightVelocity * cfg.damping) * dt;
      this.height = Math.max(0.97, Math.min(1.03, this.height + this.heightVelocity * dt));
      remaining -= dt;
    }
    if (mode !== "walk" && Math.abs(this.rotation) < 0.0001 && Math.abs(this.velocity) < 0.001) {
      this.rotation = this.velocity = 0;
    }
    return { rotation: this.rotation, width: this.width, height: this.height };
  }
}
