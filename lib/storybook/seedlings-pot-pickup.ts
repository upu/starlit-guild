import type { StoryStageCue } from "../story-stage-cues.ts";
import { SEEDLING_SCENE_CELL } from "../seedling-scene-scale.ts";

/** Pick up the full pot where it was filled before carrying it away. */
export function seedlingPotPickup(sequence: StoryStageCue["sequence"]) {
  if (!sequence) return sequence;
  const filled = sequence.find((step) => step.after === 11700);
  const carry = sequence.find((step) => step.after === 12400);
  if (!filled || !carry) return sequence;
  const pot = filled.items.find((item) => item.id === "merrill-pot");
  const held = carry.items.find((item) => item.id === "merrill-pot");
  const visitor = carry.extras?.find((extra) => extra.id === "merrill");
  const wrist = visitor?.wristPoints?.[10];
  if (!pot || !held || !visitor || !wrist) return sequence;
  const pixel = SEEDLING_SCENE_CELL / 128;
  const width = held.width ?? 0;
  const low = {
    ...visitor,
    seedlingAction: "collect" as const,
    x: pot.x - (wrist[0] - 64) * pixel,
    bottom:
      pot.bottom -
      (128 - wrist[1]) * pixel * 1.5 +
      (width / 1.3) * 0.75 -
      (held.wristOffset?.bottom ?? 0),
  };
  return [
    ...sequence.filter((step) => step !== carry),
    { ...filled, after: 12400, extras: [low] },
    { ...carry, after: 13200, extras: [low] },
    { ...carry, after: 14000, extras: [{ ...low, seedlingAction: "pot" as const }] },
    { ...carry, after: 15000 },
  ];
}
