import { ground, npc, table, onTable, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";

const handoffBottom = 27 - (29 * 19 * 1.5) / 128 + (2 / 1.3) * 0.75;
const quill = (laid: boolean): StageItem => ({
  ...ground("quill", 53.546875, 27, 2),
  id: "clerk-quill",
  ...(laid ? { support: "table", pitch: 55 } : { extra: "merchant", wrist: true }),
});
const clerk = () => npc("merchant", "町の受付", 73);
const landlord = () => npc("keeper", "倉庫の大家", 26);

export function foundingQuill(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => {
    if (beat.at < 22) return beat;
    const sequence =
      beat.at === 42
        ? [
            ...(beat.sequence ?? []),
            {
              after: 2000,
              extras: [
                landlord(),
                {
                  ...clerk(),
                  x: 58,
                  bottom: handoffBottom,
                  service: "place" as const,
                  via: [
                    { x: 73, bottom: 55 },
                    { x: 58, bottom: 55 },
                  ],
                },
              ],
            },
            { after: 5400, items: [table(), onTable("ledger"), quill(true)] },
            {
              after: 6200,
              extras: [
                landlord(),
                {
                  ...clerk(),
                  via: [
                    { x: 58, bottom: 55 },
                    { x: 73, bottom: 55 },
                  ],
                },
              ],
            },
          ]
        : beat.sequence;
    const append = (items: StageItem[], laid: boolean) =>
      items.some((p) => p.id === "clerk-quill") ? items : [...items, quill(laid)];
    return {
      ...beat,
      extras: beat.extras?.map((e) =>
        e.id === "merchant" && beat.at < 42 ? { ...e, service: "carry" } : e,
      ),
      items: beat.items && append(beat.items, beat.at > 42),
      sequence: sequence?.map((s) => ({
        ...s,
        items: s.items && append(s.items, beat.at > 42 || (beat.at === 42 && s.after >= 5400)),
      })),
    };
  });
}
