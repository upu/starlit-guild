import type {
  StageActor,
  StageExtra,
  StageItem,
  StageMoment,
  StoryStageCue,
} from "../story-stage-cues.ts";
import { inspectionLidStates as lid } from "./waterway-hatch-opening.ts";

const lamp: StageItem = {
  id: "inspection-lamp",
  art: "lantern",
  extra: "keeper",
  x: 0,
  bottom: 0,
  width: 2.1,
  wrist: true,
  wristUnmirrored: true,
  wristAnchor: "bottom",
  wristOffset: { x: 0, bottom: -6.75 },
  glow: "dim",
};
const lampOnPaving: StageItem = {
  ...lamp,
  extra: undefined,
  wrist: false,
  x: 43,
  bottom: 55.16875,
};
const basket: StageItem = {
  id: "last-basket",
  art: "basket",
  extra: "worker",
  x: 0,
  bottom: 0,
  width: 8,
  wrist: true,
  wristUnmirrored: true,
  wristAnchor: "bottom",
  wristOffset: { x: 0, bottom: -8.5 },
};
const moss: StageItem = {
  id: "last-moss",
  art: "colony",
  carrier: "last-basket",
  x: 0,
  bottom: 2.2,
  width: 4.5,
};
const palms: StageExtra["wristPoints"] = {
  ...lid.palms,
  36: [26, 113],
  37: [27, 96],
  38: [33, 83],
  39: [40, 78],
};
const worker: StageExtra = {
  id: "worker",
  x: 23,
  bottom: 28,
  carry: true,
  left: false,
  walkFrames: [32, 33, 34, 35],
  wristPoints: { 11: [43, 82], 32: [50, 82], 33: [49, 82], 34: [50, 82], 35: [49, 82] },
};

/** The emptied recess is checked by lamplight before the same cover is replaced. */
export function waterwayHatchClosing(cue: StoryStageCue): StoryStageCue {
  const actors = waitingActors(cue.actors);
  const departing = { ...worker, x: -35 };
  const props = (stone = lid.opened, groundLamp = false) => [
    stone,
    groundLamp ? lampOnPaving : lamp,
    basket,
    moss,
    { id: "tools", art: "tools" as const, x: 28, bottom: 72, width: 8 },
    ...spatula(actors),
  ];
  const keep = (state: Partial<StageExtra>) => ({
    id: "keeper" as const,
    x: 69.7,
    bottom: 57.7,
    left: false,
    wristPoints: palms,
    ...state,
  });
  const state = (
    after: number,
    k: Partial<StageExtra>,
    stone = lid.opened,
    groundLamp = false,
  ): StageMoment => ({
    after,
    actors,
    extras: [keep(k), departing],
    items: props(stone, groundLamp),
  });
  return {
    ...cue,
    background: "drain-cleared",
    cut: true,
    actors,
    initial: { aria: 32, leon: 57 },
    initialBottom: { aria: 14, leon: 14 },
    items: props(),
    extras: [keep({ lanternHandling: "hold" }), worker],
    finishBeforeAdvance: true,
    sequence: closingSteps(state, actors),
  };
}

type ClosingMoment = (
  after: number,
  k: Partial<StageExtra>,
  stone?: StageItem,
  groundLamp?: boolean,
) => StageMoment;
function closingSteps(state: ClosingMoment, actors: StageActor[]): StageMoment[] {
  const lowLamp = { x: 50.125, bottom: 57.7 };
  const lowLid = { x: 60.4125, bottom: 57.7 };
  return [
    state(700, { lanternHandling: "hold" }),
    state(1000, { lanternHandling: "lift" }),
    state(1500, { lanternHandling: "hold" }),
    state(2000, { ...lowLamp, lanternHandling: "hold" }),
    state(3300, { ...lowLamp, lanternHandling: "low" }),
    state(3750, { ...lowLamp, lanternHandling: "low" }, lid.opened, true),
    state(4100, { ...lowLamp, lanternHandling: "lift" }, lid.opened, true),
    state(4550, { ...lowLid, hatchOpening: "idle" }, lid.opened, true),
    state(5250, { ...lowLid, hatchOpening: "grip" }, lid.opened, true),
    state(5700, { ...lowLid, hatchOpening: "grip" }, { ...lid.held, tilt: 12 }, true),
    state(6150, { x: 59.6625, bottom: 57.7, hatchOpening: "lift" }, lid.held, true),
    state(6650, { x: 59.1, bottom: 57.7, hatchOpening: "hold" }, lid.held, true),
    state(
      7150,
      { x: 73.3, bottom: 57.7, hatchOpening: "hold", carry: true, walkFrames: [35, 34, 33, 32] },
      lid.held,
      true,
    ),
    state(8050, { x: 73.3, bottom: 57.7, hatchOpening: "hold" }, lid.held, true),
    state(8400, { x: 73.8625, bottom: 57.7, hatchOpening: "lift" }, lid.held, true),
    state(8900, { x: 74.6125, bottom: 57.7, hatchOpening: "grip" }, lid.held, true),
    state(9400, { x: 74.6125, bottom: 57.7, hatchOpening: "grip" }, lid.closed, true),
    state(9850, { x: 74.6125, bottom: 57.7, hatchOpening: "idle" }, lid.closed, true),
    state(
      10200,
      { x: 75, bottom: 14, hatchOpening: "idle", via: [{ x: 75, bottom: 36 }] },
      lid.closed,
      true,
    ),
    {
      ...state(12100, { x: -25, bottom: 14, hatchOpening: "idle" }, lid.closed, true),
      actors: actors.map((a) => ({ ...a, x: a.id === "aria" ? -55 : -40, left: true })),
    },
  ];
}

export function waitingActors(actors: StageActor[]): StageActor[] {
  return actors.map((a) => ({
    ...a,
    x: a.id === "aria" ? 32 : 57,
    bottom: 14,
    left: false,
    seated: false,
    perch: false,
    inspect: false,
    carry: a.id === "aria",
    holdingWalk: a.id === "aria",
    pose: "idle",
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      13: [78, 109],
      14: [86, 76],
      15: [86, 76],
      16: [86, 76],
      8: [84, 70],
      9: [84, 70],
      22: [84, 70],
      23: [84, 70],
    },
  }));
}

export function spatula(actors: StageActor[]): StageItem[] {
  return actors.some((a) => a.id === "aria" && a.carry)
    ? [
        {
          id: "spatula",
          art: "spatula",
          actor: "aria",
          x: 0,
          bottom: 0,
          width: 2.5,
          wrist: true,
          wristAnchor: "bottom",
        },
      ]
    : [];
}
