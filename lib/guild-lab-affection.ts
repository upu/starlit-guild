import type { PortraitExpression } from "./portrait-expressions.ts";
import type { LabPose } from "./guild-lab-model.ts";

export type LabExpression = Extract<
  PortraitExpression,
  "neutral" | "smile" | "surprised" | "tired" | "serious" | "shy"
>;
export type LabMark = "note" | "notice" | "sweat" | "sleep" | "heart" | "thought" | null;
export type LabFeeling = {
  expression: LabExpression;
  yawn: boolean;
  mark: LabMark;
  blush: boolean;
  jump: number;
  stretch: number;
  squash: number;
  look: number;
  gesture: "none" | "look" | "stretch" | "hum";
  markAge: number;
};
const empty = (): LabFeeling => ({
  expression: "neutral",
  yawn: false,
  mark: null,
  blush: false,
  jump: 0,
  stretch: 0,
  squash: 0,
  look: 0,
  gesture: "none",
  markAge: 0,
});

// Ephemeral, scene-owned reactions. No game state, story selection or storage.
export class LabAffection {
  private mode: LabPose = "tea";
  private since = 0;
  private touched = -Infinity;
  private chain = 0;
  private taps = 0;
  private looked = -Infinity;
  private lookDirection = 0;
  private nextIdle = 0;
  private gestureAt = -Infinity;
  private gesture: LabFeeling["gesture"] = "none";
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
    this.schedule(0);
  }
  enter(mode: LabPose, time: number) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.since = time;
    this.gestureAt = -Infinity;
    this.schedule(time);
  }
  tap(time: number) {
    this.chain = time - this.touched < 1200 ? this.chain + 1 : 1;
    this.touched = time;
    this.taps++;
    this.since = time;
    this.schedule(time);
  }
  lookAt(time: number, direction: number) {
    this.looked = time;
    this.lookDirection = Math.max(-1, Math.min(1, direction));
  }
  private schedule(time: number) {
    this.nextIdle = time + 10000 + this.random() * 10000;
  }
  private idle(time: number, result: LabFeeling) {
    const age = time - this.since;
    if (this.mode === "idle" && age >= 26000) {
      result.expression = "tired";
      result.yawn = age < 27800;
      result.mark = "sleep";
      result.markAge = age - 26000;
      return;
    }
    if (time >= this.nextIdle) {
      const gestures =
        this.mode === "tea" ? (["look", "hum"] as const) : (["look", "stretch", "hum"] as const);
      this.gesture =
        gestures[Math.min(gestures.length - 1, Math.floor(this.random() * gestures.length))];
      this.gestureAt = time;
      this.schedule(time);
    }
    const progress = (time - this.gestureAt) / 2200;
    if (progress < 0 || progress >= 1) return;
    result.gesture = this.gesture;
    result.markAge = time - this.gestureAt;
    if (this.gesture === "hum") {
      result.expression = "smile";
      result.mark = "note";
    }
    if (this.gesture === "look") {
      result.look = Math.sin(progress * Math.PI * 2) * 0.065;
      result.mark = "thought";
    }
    if (this.gesture === "stretch") result.stretch = Math.sin(progress * Math.PI);
  }
  private reaction(time: number, result: LabFeeling) {
    const age = time - this.touched;
    if (age >= 2400) return;
    result.yawn = false;
    result.gesture = "none";
    result.stretch = 0;
    result.markAge = age;
    if (this.chain > 1) {
      result.expression = "shy";
      result.blush = true;
      result.mark = (["thought", "sweat", "heart"] as const)[(this.chain - 2) % 3];
    } else {
      this.greeting(age, result);
    }
  }
  private greeting(age: number, result: LabFeeling) {
    result.expression = age < 350 ? "surprised" : "smile";
    result.mark = age < 350 || this.taps % 2 === 0 ? "notice" : "heart";
    result.squash = age < 180 ? Math.sin((age / 180) * Math.PI) : 0;
    if (age >= 180 && age < 720) result.jump = Math.sin(((age - 180) / 540) * Math.PI) * 6;
  }
  sample(time: number, reduced: boolean): LabFeeling {
    const result = empty(),
      age = time - this.since;
    if (this.mode === "idle" || this.mode === "tea") this.idle(time, result);
    if (this.mode === "tea" && time % 8000 >= 6500) {
      result.expression = "smile";
      result.mark = "note";
      result.markAge = (time % 8000) - 6500;
    }
    if (this.mode === "work" && (age < 1600 || age % 9000 < 2000)) {
      result.expression = "serious";
      result.mark = "sweat";
      result.markAge = age % 9000;
    }
    this.reaction(time, result);
    if (time - this.looked < 1700)
      result.look += this.lookDirection * 0.065 * (1 - (time - this.looked) / 1700);
    if (reduced) {
      result.jump = 0;
      result.stretch = 0;
      result.squash = 0;
      result.look = 0;
    }
    return result;
  }
}
