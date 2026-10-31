import type { StageMoment } from "../story-stage-cues.ts";

/** Ownership changes only after the corresponding hand has reached its target. */
export function recordsFieldSequence(
  sequence: StageMoment[] | undefined,
  returning: boolean,
  line: number,
) {
  if (!sequence) return sequence;
  if (!returning && line === 42) return sequence.map((s) => ({ ...s, after: s.after + 350 }));
  if (returning && line === 8)
    return sequence.map((s) =>
      s.after >= 3200 && s.after <= 4600
        ? {
            ...s,
            actors: s.actors.map((a) =>
              a.id === "lico" ? { ...a, recordStudy: "read" as const } : a,
            ),
          }
        : s,
    );
  return sequence;
}
