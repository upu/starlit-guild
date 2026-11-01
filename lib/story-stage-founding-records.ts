import { ground, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra } from "./story-stage-cues.ts";

const keeperSeat = (extra: StageExtra): StageExtra =>
  extra.id === "keeper" ? { ...extra, bottom: 38, chair: true, left: false } : extra;
const records = () => [
  { ...ground("dining-table", 33, 35, 22), id: "keeper-desk" },
  { ...ground("ledger", 33, 44, 5.2), id: "keeper-records", support: "keeper-desk" },
];

export function foundingRecords(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => {
    if (beat.at >= 37) return beat.at === 37 ? { ...beat, furniture: [] } : beat;
    const extras = beat.extras?.map(keeperSeat);
    return {
      ...beat,
      ...(beat.at === 0
        ? {
            finishBeforeAdvance: true,
            furniture: records(),
            sequence: [{ after: 2400, extras }],
          }
        : {}),
      extras: beat.at === 0 ? extras?.map((e) => ({ ...e, deskWork: "write" })) : extras,
      items: beat.items?.filter((p) => p.art !== "ledger"),
      ...(beat.sequence
        ? {
            sequence: beat.sequence.map((step) => ({
              ...step,
              extras: step.extras?.map(keeperSeat),
              items: step.items?.filter((p) => p.art !== "ledger"),
            })),
          }
        : {}),
    };
  });
}
