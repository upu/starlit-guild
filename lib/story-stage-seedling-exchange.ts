import { ground, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

const recipient = (seedlingAction: StageExtra["seedlingAction"] = "receive"): StageExtra => ({
  id: "merrill",
  name: "緑髪の少女",
  x: 73.125,
  bottom: 15.46875,
  left: true,
  seedlingAction,
});
const sample = (extra = false): StageItem => ({
  ...ground("moss", 0, 0, 3),
  id: "comparison-sprig",
  wrist: true,
  wristAnchor: "bottom",
  ...(extra ? { extra: "merrill" as const } : { actor: "lico" as const }),
});
const heldSample = (): StageItem => ({
  ...ground("moss", -3, 29, 3),
  id: "comparison-sprig",
  extra: "merrill",
});
const note = (extra = false): StageItem => ({
  ...ground("paper", 0, 0, 3.5),
  id: "route-slip",
  wrist: true,
  ...(extra ? { extra: "merrill" as const } : { actor: "lico" as const }),
});

export function seedlingExchange(baskets: () => StageItem[]): LaterBeat[] {
  const floor = () => [...baskets(), heldSample()];
  return [
    {
      at: 10,
      finishBeforeAdvance: true,
      actors: { lico: { mossStudy: "reach", left: false } },
      items: [...baskets(), { ...ground("moss", 68, 24, 3), id: "comparison-sprig" }],
      sequence: [{ after: 900, items: [...baskets(), sample()] }],
    },
    {
      at: 16,
      finishBeforeAdvance: true,
      actors: { lico: { mossStudy: "reach", left: false } },
      extras: [recipient()],
      items: [...baskets(), sample()],
      sequence: [
        { after: 1500, items: [...baskets(), sample(true)] },
        { after: 2400, actors: { lico: { mossStudy: "glasses" } }, items: floor() },
      ],
    },
    { at: 17, extras: [recipient("play")] },
    { at: 19, extras: [{ ...recipient(), seedlingAction: undefined, pose: "explain" }] },
    {
      at: 23,
      finishBeforeAdvance: true,
      actors: { lico: { mossStudy: "write" } },
      items: floor(),
      sequence: [
        { after: 900, actors: { lico: { paperAction: "strike-start" } } },
        { after: 1300, actors: { lico: { paperAction: "strike-end" } } },
        { after: 1900, actors: { lico: { paperAction: undefined, mossStudy: "page" } } },
      ],
    },
    {
      at: 29,
      finishBeforeAdvance: true,
      actors: { lico: { mossStudy: "write" } },
      items: floor(),
      extras: [recipient()],
      sequence: routeSlipSequence(floor),
    },
    {
      at: 30,
      extras: [{ ...recipient(), name: "メリル", seedlingAction: undefined, pose: "explain" }],
    },
  ];
}
function routeSlipSequence(floor: () => StageItem[]): LaterBeat["sequence"] {
  return [
    { after: 1200, actors: { lico: { paperAction: "tear-start" } } },
    { after: 1800, actors: { lico: { paperAction: "tear-end" } } },
    {
      after: 2400,
      actors: { lico: { paperAction: undefined, mossStudy: "reach" } },
      items: [...floor(), note()],
    },
    { after: 3100, items: [...floor(), note(true)] },
    {
      after: 3700,
      extras: [recipient("stow")],
      items: [...floor(), { ...note(true), embeddedFrames: [9] }],
    },
    { after: 4000, actors: { lico: { mossStudy: "glasses" } } },
    {
      after: 4300,
      extras: [{ ...recipient(), seedlingAction: undefined, pose: "idle" }],
      items: floor(),
    },
  ];
}
