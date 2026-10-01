import type { LabPose } from "./guild-lab-model.ts";
export function labAnkle(time: number, index: number, mode: LabPose, reduced = false) {
  if (reduced || mode !== "walk") return { angle: 0, phase: "rest" as const };
  const p = (time / 900 + index / 2) % 1;
  if (p < 0.055) return { angle: (-10 * (1 - p / 0.055) * Math.PI) / 180, phase: "heel" as const };
  if (p >= 0.5)
    return {
      angle: (-7 * Math.sin((p - 0.5) * Math.PI * 2) * Math.PI) / 180,
      phase: "swing" as const,
    };
  if (p > 0.445)
    return { angle: (((15 * (p - 0.445)) / 0.055) * Math.PI) / 180, phase: "push" as const };
  return { angle: 0, phase: "plant" as const };
}
