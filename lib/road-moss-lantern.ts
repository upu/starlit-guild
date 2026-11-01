export type MossHatchPhase =
  | "idle"
  | "approach"
  | "inspect-approach"
  | "inspect-lower"
  | "inspect"
  | "inspect-rise"
  | "lantern-approach"
  | "lantern-pick"
  | "lantern-return"
  | "lantern-place"
  | "pick"
  | "carry"
  | "place"
  | "release";

export const lanternWalking = (phase: MossHatchPhase) =>
  ["approach", "lantern-approach", "inspect-approach", "lantern-return"].includes(phase);
export const lanternPose = (phase: MossHatchPhase) =>
  ["lantern-pick", "inspect-lower", "inspect", "inspect-rise", "lantern-place"].includes(phase);
export const lanternCarried = (phase: MossHatchPhase) =>
  lanternPose(phase) || phase === "inspect-approach" || phase === "lantern-return";

export function lanternFrame(phase: MossHatchPhase, age: number) {
  if (phase === "inspect") return 0;
  const step = Math.min(3, Math.floor(Math.max(0, age) / 200));
  return phase === "lantern-pick" || phase === "inspect-rise" ? step : 3 - step;
}

export function coverFrame(phase: MossHatchPhase, age: number) {
  if (phase === "pick") return age < 200 ? 1 : age < 550 ? 2 : 3;
  if (phase === "place") return age < 250 ? 2 : 1;
  return phase === "release" ? 1 : 0;
}
