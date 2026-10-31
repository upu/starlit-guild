import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { indoorStudyCue } from "./indoor-cue.ts";
import { sampleStageActor } from "../story-stage.ts";
import { foundingPaperCircuit } from "./founding-paper-circuit.ts";
import { foundingSigningPickup } from "./founding-signing-pickup.ts";

const samplePlace = { x: 64.3671875, bottom: 29 };
const palms = { hold: [86, 79], write: [85, 81] } as const;

/** Retain the tested seat transitions; register current painted hands and vessels. */
export function foundingReturnStudyCue(cue: StoryStageCue, line?: number): StoryStageCue {
  const prepared = indoorStudyCue(cue, line);
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    ...s,
    actors: s.actors.map((a) => returnActor(a, line)),
    items: (s.items ?? []).map((i) => returnItem(i, line)),
  });
  const adjusted = {
    ...prepared,
    ...adjust(prepared),
    sequence: prepared.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
  return line === 35
    ? foundingPaperCircuit(adjusted)
    : line === 64
      ? foundingSigningPickup(adjusted)
      : adjusted;
}
function returnActor(a: StageActor, line?: number): StageActor {
  // As Finn walks behind Lico to leave the chair, a foot-level label covers her.
  if (a.id === "finn" && line === 42) return { ...a, nameAbove: true };
  if (a.id === "aria" && a.x === 66)
    return {
      ...a,
      x: samplePlace.x + (15 * 19) / 128,
      bottom: samplePlace.bottom - ((52 * 19) / 128) * 1.5,
      wristPoints: {
        ...a.wristPoints,
        14: [79, 76],
        15: [79, 76],
        16: [79, 76],
        8: [83, 73],
        9: [83, 73],
        22: [83, 73],
        23: [83, 73],
      },
      carryWalkFrames: [8, 9, 22, 23],
    };
  if (a.id !== "lico") return a;
  if (a.mossStudy === "reach" || a.mossStudy === "write") return specimenActor(a);
  if (line === 35 && a.carry) return paperActor(a);
  return a;
}
function specimenActor(a: StageActor): StageActor {
  const writing = a.mossStudy === "write",
    palm = writing ? palms.write : palms.hold;
  const height = samplePlace.bottom + (writing ? 1.4 : 0);
  return {
    ...a,
    x: samplePlace.x - (((palm[0] - 64) * 19) / 128) * (a.left ? -1 : 1),
    bottom: height - (((128 - palm[1]) * 19) / 128) * 1.5,
    wristPoints: {
      ...a.wristPoints,
      73: [...palms.hold],
      69: [...palms.write],
      70: [...palms.write],
    },
    reachOver: "table",
    carryWalkFrames: [8, 9, 22, 23],
  };
}
function paperActor(a: StageActor): StageActor {
  const old = sampleStageActor(a, a, 0, true).wrist;
  if (!old) return a;
  return {
    ...a,
    x: a.x + (((old.x - palms.hold[0]) * 19) / 128) * (a.left ? -1 : 1),
    bottom: (a.bottom ?? 14) + (((palms.hold[1] - old.y) * 19) / 128) * 1.5,
    wristPoints: {
      ...a.wristPoints,
      14: [...palms.hold],
      15: [...palms.hold],
      16: [...palms.hold],
      8: [83, 77],
      9: [83, 77],
      22: [83, 77],
      23: [83, 77],
    },
    carryWalkFrames: [8, 9, 22, 23],
  };
}
function returnItem(i: StageItem, line?: number): StageItem {
  if (line !== undefined && line > 50 && i.id === "representative-chair")
    return { ...i, turn: 180 };
  // Leon's writing pose already contains a small sheet; match it when he
  // raises the signed paper instead of covering his face with a larger one.
  if (line !== undefined && line >= 65 && i.id === "ledger" && i.actor === "leon")
    return { ...i, width: 3.5 };
  if (line !== undefined && line < 52 && i.id === "ledger" && i.support === "table")
    return { ...i, x: 50 };
  return i.art === "sample-dish" && i.wrist
    ? { ...i, wristAnchor: "bottom", wristOffset: undefined }
    : i;
}
