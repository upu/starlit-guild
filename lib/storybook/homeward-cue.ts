import type { StageItem, StageActor, StoryStageCue } from "../story-stage-cues.ts";

function carried(i: StageItem, rising = false): StageItem {
  if (!i.actor) return i;
  if (i.id === "medicine")
    return {
      ...i,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
      wristOffset: { x: 1, bottom: -6.5 },
      grip: rising ? "offering" : "receiving",
    };
  if (i.id === "bottle-bag")
    return {
      ...i,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 1.5 },
    };
  return i;
}
function morningActor(a: StageActor): StageActor {
  return a.id === "mira"
    ? {
        ...a,
        x: 74.3,
        packing: false,
        inspect: !a.carry,
        wristPoints: { ...a.wristPoints, 13: [84, 111], 46: [77, 99] },
      }
    : a;
}
function carryingActor(a: StageActor): StageActor {
  if (a.id !== "mira" || !a.carry) return a;
  return {
    ...a,
    holdingWalk: true,
    wristPoints: {
      ...a.wristPoints,
      14: [73, 84],
      15: [73, 84],
      16: [73, 84],
      8: [72, 83],
      9: [73, 83],
      22: [72, 83],
      23: [71, 83],
    },
  };
}
export function homewardStudyCue(cue: StoryStageCue, line: number): StoryStageCue {
  const morning = cue.background === "village-house";
  const actors = (cast: StageActor[]) =>
    cast.map((actor) => carryingActor(morning ? morningActor(actor) : actor));
  const items = (props: StageItem[], rising = false) =>
    props.map((i) => {
      if (i.art === "empty-cart") return { ...i, x: -13.1, bottom: 20, left: false };
      if (i.id === "passing-goods") return { ...i, bottom: 14 };
      return carried(i, rising);
    });
  const extras = (cast: StoryStageCue["extras"]) =>
    cast?.map((e) => (e.id === "worker" ? { ...e, pullCart: !!e.carry } : e));
  const sequence = cue.sequence?.flatMap((s) => {
    const step = {
      ...s,
      actors: actors(s.actors),
      items: items(s.items, morning && line === 0 && s.after === 700),
      extras: extras(s.extras),
    };
    if (!morning && s.after === 4500)
      return [
        step,
        {
          ...step,
          after: 4900,
          extras: step.extras?.map((e) =>
            e.id === "worker" ? { ...e, hatGreeting: "lower" as const } : e,
          ),
        },
      ];
    if (!morning || line !== 0 || s.after !== 700) return [step];
    return [
      {
        ...step,
        actors: step.actors.map((a) =>
          a.id === "mira" ? { ...a, carry: false, inspect: false, healing: "rise" as const } : a,
        ),
      },
      { ...step, after: 1500, items: items(s.items) },
    ];
  });
  return {
    ...cue,
    actors: actors(cue.actors),
    initial: morning ? { ...cue.initial, mira: 74.3 } : cue.initial,
    items: cue.items && items(cue.items),
    extras: extras(cue.extras),
    sequence,
    finishBeforeAdvance: !!sequence?.length,
  };
}
