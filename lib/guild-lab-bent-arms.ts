import type { LabCharacterArt } from "./guild-lab-characters.ts";

export function labBentArm(
  art: LabCharacterArt,
  index: number,
  upper: number,
  lower: number,
  lengths: readonly number[],
  scale = 1,
) {
  if (!("variants" in art) || (Math.abs(lower) * 180) / Math.PI < 45) return null;
  const choices = art.variants.filter((p) => p.kind === "arm" && p.side === index);
  const variant = choices.reduce((best, p) =>
    Math.abs(p.bend - (Math.abs(lower) * 180) / Math.PI) <
    Math.abs(best.bend - (Math.abs(lower) * 180) / Math.PI)
      ? p
      : best,
  );
  const x = (-Math.sin(upper) * lengths[0] - Math.sin(upper + lower) * lengths[1]) * scale;
  const y = (Math.cos(upper) * lengths[0] + Math.cos(upper + lower) * lengths[1]) * scale;
  const dx = variant.end[0] - variant.root[0],
    dy = variant.end[1] - variant.root[1];
  return {
    variant,
    x,
    y,
    rotation: Math.atan2(y, x) - Math.atan2(dy, dx),
    scale: Math.hypot(x, y) / (lengths[0] + lengths[1]),
  };
}
