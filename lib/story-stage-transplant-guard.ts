import { ground, type LaterBeat } from "./story-stage-later-shared.ts";

const threat = (x: number) => ({
  ...ground("slime", x, 34, 7),
  id: "transplant-threat",
  travelMs: 1400,
});

export function transplantGuard(beats: LaterBeat[]): LaterBeat[] {
  let previous = beats[0].items ?? [];
  return beats.map((beat) => {
    const initial = beat.items ?? previous;
    previous = beat.sequence?.filter((s) => s.items).at(-1)?.items ?? initial;
    if (beat.at !== 37) return beat;
    let items = initial;
    let x = -8;
    const steps = [...(beat.sequence ?? []), { after: 600 }, { after: 3400 }, { after: 4600 }].sort(
      (a, b) => a.after - b.after,
    );
    return {
      ...beat,
      items: [...initial, threat(x)],
      sequence: steps.map((step) => {
        items = step.items ?? items;
        if (step.after === 600) x = 24;
        if (step.after === 3400) x = 5;
        if (step.after === 4600) x = -10;
        const leon =
          step.after === 2600
            ? { sword: "strike" as const }
            : step.after === 3400
              ? { sword: true }
              : undefined;
        return {
          ...step,
          actors: { ...step.actors, ...(leon ? { leon } : {}) },
          items: [...items, threat(x)],
        };
      }),
    };
  });
}
