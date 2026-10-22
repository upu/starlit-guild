import type { StageActor, StageItem } from "./story-stage-cues.ts";
import { actor, scene, type LaterBeat, type LaterStage } from "./story-stage-later-shared.ts";

/** A chair stays at its authored floor position when its occupant gets up. */
export const chair = (sitter: StageActor, cell = 21): StageItem => ({
  id: `chair-${sitter.id}`,
  art: "chair",
  x: sitter.x,
  bottom: (sitter.bottom ?? 14) + (cell * 1.5 * 8) / 128,
  width: cell * 0.3,
  left: sitter.left,
  seatFor: sitter.id,
});

export function diningCast(includeFinn = true) {
  const cast = [
    actor("aria", 35, { bottom: 14, seated: true, chair: true }),
    actor("leon", 65, { bottom: 14, seated: true, chair: true }),
    actor("mira", 39, { bottom: 22, seated: true, chair: true }),
  ];
  if (includeFinn) cast.push(actor("finn", 61, { bottom: 22, seated: true, chair: true }));
  return cast;
}

export function diningItems(items: StageItem[]): StageItem[] {
  return items.map((p) =>
    p.art === "table"
      ? { ...p, art: "dining-table", width: 32, bottom: 16 }
      : p.support === "table"
        ? { ...p, bottom: 27 }
        : p,
  );
}

export function diningScene(
  beats: LaterBeat[],
  extra: Partial<LaterStage> = {},
  includeFinn = true,
) {
  const cast = diningCast(includeFinn);
  return scene(
    "dining-room",
    cast,
    beats.map((b) => ({ ...b, items: b.items && diningItems(b.items) })),
    {
      furniture: cast.map((a) => chair(a)),
      exitLanes: { mira: 48, finn: 48 },
      ...extra,
    },
  );
}
