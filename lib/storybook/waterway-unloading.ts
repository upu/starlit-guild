import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const cart: StageItem = { id: "repair-tool-cart", art: "empty-cart", x: 46, bottom: 34, width: 32 };
const tools: StageItem = { id: "tools", art: "tools", x: 51, bottom: 30, width: 9 };
const floorRope: StageItem = {
  id: "last-rope",
  art: "rope-coil",
  x: 59.875,
  bottom: 32.65625,
  width: 5,
  travelMs: 400,
};
const onCart: StageItem = { ...floorRope, carrier: cart.id, x: 5.0625, bottom: 19.125 };
const held: StageItem = {
  ...floorRope,
  x: 0,
  bottom: 0,
  extra: "merchant",
  wrist: true,
  wristAnchor: "bottom",
  wristOffset: { x: 0, bottom: -5.5 },
  support: cart.id,
};
const palms: StageExtra["wristPoints"] = {
  20: [27, 76],
  12: [35, 80],
  22: [64, 78],
  23: [86, 78],
  13: [34, 99],
  14: [34, 99],
  8: [76, 80],
  9: [78, 80],
  10: [78, 80],
  11: [79, 80],
};
const merchant: StageExtra = {
  id: "merchant",
  x: 58,
  bottom: 44,
  left: false,
  unloading: "idle",
  wristPoints: palms,
};
type Action = "reach" | "carry" | "front" | "right" | "lower" | "release" | "idle";
function unloadingMerchant(action: Action, x = 58, bottom = 44): StageExtra {
  const service: Partial<Record<Action, StageExtra["service"]>> = {
    carry: "carry",
    lower: "place",
    release: "raise",
  };
  const unloading: Partial<Record<Action, StageExtra["unloading"]>> = {
    reach: "reach",
    front: "front",
    right: "right",
    idle: "idle",
  };
  const handRects: Partial<Record<Action, [number, number, number, number]>> = {
    reach: [15, 64, 30, 16],
    carry: [24, 64, 30, 20],
    front: [47, 64, 34, 18],
    right: [69, 64, 32, 18],
    lower: [20, 90, 32, 14],
    release: [20, 90, 32, 14],
  };
  const rect = handRects[action];
  return {
    ...merchant,
    x,
    bottom,
    service: service[action],
    unloading: unloading[action],
    carry: ["carry", "front", "right", "lower"].includes(action),
    handOver: rect ? { item: cart.id, rect } : undefined,
  };
}

/** The last rope remains one object while it leaves the cart, turns in the hands and reaches the ground. */
export function waterwayUnloadingCue(cue: StoryStageCue, line: number): StoryStageCue {
  const actors =
    line < 6
      ? cue.actors.map((actor) => ({ ...actor, x: actor.id === "aria" ? 27 : 82, bottom: 8 }))
      : cue.actors;
  const extras = (person: StageExtra) => [
    ...(cue.extras ?? []).filter((extra) => extra.id !== "merchant"),
    person,
  ];
  const items = (rope: StageItem) => [
    ...(cue.items ?? []).filter((item) => item.id !== "tools"),
    cart,
    tools,
    rope,
  ];
  const rest = {
    ...cue,
    actors,
    initial: line === 0 ? { aria: 27, leon: 82 } : cue.initial,
    initialBottom: line === 0 ? { aria: 8, leon: 8 } : cue.initialBottom,
    extras: extras(merchant),
    items: items(line === 0 ? onCart : floorRope),
  };
  if (line !== 1)
    return {
      ...rest,
      extras: extras(line === 0 ? unloadingMerchant("reach") : merchant),
      sequence: cue.sequence?.map((beat) => ({
        ...beat,
        extras: [...(beat.extras ?? []).filter((extra) => extra.id !== "merchant"), merchant],
        items: [...beat.items.filter((item) => item.id !== "tools"), cart, tools, floorRope],
      })),
    };
  const state = (person: StageExtra, rope = held) => ({
    actors,
    extras: extras(person),
    items: items(rope),
  });
  const walking = { ...unloadingMerchant("right", 65.5, 30), via: [{ x: 65.5, bottom: 44 }] };
  const returning = { ...merchant, via: [{ x: 65.5, bottom: 44 }] };
  return {
    ...rest,
    ...state(unloadingMerchant("reach"), onCart),
    finishBeforeAdvance: true,
    sequence: [
      { after: 550, ...state(unloadingMerchant("reach")) },
      { after: 1000, ...state(unloadingMerchant("carry")) },
      { after: 1350, ...state(unloadingMerchant("front")) },
      { after: 1700, ...state(unloadingMerchant("right")) },
      { after: 2050, ...state(walking) },
      { after: 3200, ...state(unloadingMerchant("front", 65.5, 30)) },
      { after: 3550, ...state(unloadingMerchant("carry", 65.5, 30)) },
      { after: 3900, ...state(unloadingMerchant("lower", 65.5, 30)) },
      { after: 4350, ...state(unloadingMerchant("release", 65.5, 30), floorRope) },
      { after: 4900, ...state(unloadingMerchant("idle", 65.5, 30), floorRope) },
      { after: 5350, ...state(returning, floorRope) },
      { after: 6500, ...state(merchant, floorRope) },
    ],
  };
}
