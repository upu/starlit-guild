import { ground, held, table, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";

export const topSheet = (onDesk = false): StageItem =>
  onDesk
    ? { ...ground("paper", 50, 27, 7), id: "ledger", support: "table", pitch: 55 }
    : held("paper", "leon", { id: "ledger", width: 7, wrist: true });
const notes = (folded = false, onDesk = false): StageItem => ({
  ...held(folded ? "folded-paper" : "paper", "leon", {
    id: "leon-notes",
    width: folded ? 3.5 : 7,
    wrist: true,
    wristOffset: { x: 0.6, bottom: -0.8 },
  }),
  ...(onDesk
    ? { actor: undefined, wrist: false, x: 58, bottom: 27, support: "table", pitch: 55 }
    : {}),
});

export const openFoundingNotes: LaterBeat = {
  at: 52,
  items: [table(), topSheet(), notes()],
};
export const foldFoundingNotes: LaterBeat = {
  at: 60,
  finishBeforeAdvance: true,
  sequence: [
    { after: 900, items: [table(), topSheet(), notes(true)] },
    { after: 1800, items: [table(), topSheet(), notes(true, true)] },
    { after: 2700, items: [table(), topSheet(true), notes(true, true)] },
  ],
};

export function retainFoundingNotes(beats: LaterBeat[]): LaterBeat[] {
  const keep = (items: StageItem[]) =>
    items.some((p) => p.id === "leon-notes") ? items : [...items, notes(true, true)];
  return beats.map((beat) =>
    beat.at <= 60
      ? beat
      : {
          ...beat,
          items: beat.items && keep(beat.items),
          sequence: beat.sequence?.map((s) => ({ ...s, items: s.items && keep(s.items) })),
        },
  );
}
