import type { StageActor, StageItem, StageMoment, StoryStageCue } from "../story-stage-cues.ts";
import { journeyDuration } from "../story-stage-travel.ts";
import { lunchActor, lunchContact } from "./lunch-cue.ts";

type Action = NonNullable<StageActor["snackAction"]>;
type Owner = "aria" | "leon";
const parcelWidth = 6.2;
const bag: StageItem = {
  id: "picnic-day-bag",
  art: "delivery-bag",
  actor: "aria",
  x: -2.7,
  bottom: 26,
  width: parcelWidth + 0.2,
};
function parcel(id: string, owner: Owner, stacked = false): StageItem {
  return {
    id,
    art: "bread",
    actor: owner,
    x: 0,
    bottom: 0,
    width: parcelWidth,
    wrist: true,
    wristAnchor: "bottom",
    wristOffset: { x: stacked ? 3 : 0, bottom: stacked ? 2.5 : 0 },
  };
}

/** Two bread parcels remain distinct; the transferred one is then stowed in Aria's bag. */
export function picnicDepartureCue(cue: StoryStageCue, line: number): StoryStageCue {
  const actors = cue.actors.map((a) => ({ ...a, carry: a.id === "leon" }));
  const remaining = [bag, parcel("spare", "leon")];
  const items =
    line < 5 ? [bag, parcel("bread", "leon"), parcel("spare", "leon", true)] : remaining;
  if (line !== 5) return { ...cue, actors, items };
  const pixel = (cue.cell ?? 24) / 128;
  const leon = actors.find((a) => a.id === "leon");
  if (!leon) return { ...cue, actors, items };
  const close = actors.map((a) =>
    a.id === "aria"
      ? {
          ...a,
          carry: true,
          left: false,
          x: leon.x - 40 * pixel,
          bottom: (leon.bottom ?? 14) + 4 * pixel * 1.5,
          nameOffset: -12,
        }
      : { ...a, left: true, nameOffset: 12 },
  );
  const meet = Math.max(
    900,
    ...close.map((a) => journeyDuration(a, actors.find((b) => b.id === a.id) ?? a)),
  );
  const receive = [bag, parcel("bread", "aria"), parcel("spare", "leon")];
  const stash = [
    ...remaining,
    {
      id: "bread",
      art: "bread" as const,
      carrier: bag.id,
      x: 0,
      bottom: -0.6,
      width: parcelWidth,
      behindOwner: true,
    },
  ];
  return {
    ...cue,
    actors: close,
    items: [bag, parcel("bread", "leon"), parcel("spare", "leon", true)],
    finishBeforeAdvance: true,
    sequence: [
      { after: meet + 200, actors: close, items: receive, extras: cue.extras },
      { after: meet + 1000, actors: close, items: stash, extras: cue.extras },
      { after: meet + 1700, actors, items: remaining, extras: cue.extras },
    ],
  };
}

const cloth: StageItem = { id: "picnic-cloth", art: "picnic-cloth", x: 48, bottom: 19, width: 24 };
const loaf = (owner: Owner): StageItem => ({
  id: owner + "-loaf",
  art: "bread",
  x: owner === "aria" ? 45.4 : 49.2,
  bottom: 24.7,
  width: 4.5,
  image: `/storybook-study/${owner === "aria" ? "lunch-bread" : "bread-roll"}-v1.webp`,
});
function portion(
  id: string,
  owner: Owner,
  action: Action,
  second = false,
  bitten = false,
): StageItem {
  return {
    id,
    art: "bread-half",
    actor: owner,
    x: 0,
    bottom: 0,
    width: 2.4,
    image: `/storybook-study/${bitten ? "common-bread-half" : "bread-roll"}-v1.webp`,
    wrist: true,
    wristAnchor: "bottom",
    wristOffset: { x: (action === "offer" ? 1.5 : 0) + (second ? -1 : 1), bottom: -1 },
  };
}
function portions(owner: Owner, action: Action, bitten = false): StageItem[] {
  return [
    portion(owner + "-white", owner, action, false, bitten),
    portion(owner + "-walnut", owner, action, true),
  ];
}
const onCloth = (owner: Owner, bitten = false) =>
  portions(owner, "reach", bitten).map((i) => lunchContact(i, "reach"));

function picnicState(cue: StoryStageCue) {
  const props: StageItem[] = [cloth, { ...bag, actor: undefined, x: 37, bottom: 24 }];
  return (
    aria: Action,
    leon: Action,
    food: StageItem[],
  ): Pick<StageMoment, "actors" | "items"> => ({
    actors: cue.actors.map((a) => lunchActor(a, a.id === "aria" ? aria : leon)),
    items: [...props, ...food],
  });
}

/** Reuse the calibrated seated lunch actions for opening, sharing and tasting the bread. */
export function picnicReturnCue(cue: StoryStageCue, line: number): StoryStageCue {
  const state = picnicState(cue);
  const held = (aria: Action, leon: Action) => [
    ...portions("aria", aria, line >= 11),
    ...(line >= 11 ? portions("leon", leon, true) : onCloth("leon")),
  ];
  let start =
    line < 5
      ? state("idle", line === 4 ? "split" : "idle", [loaf("aria"), loaf("leon")])
      : state("lap", line >= 11 ? "lap" : "idle", held("lap", "lap"));
  const sequence: StageMoment[] = [];
  const step = (after: number, aria: Action, leon: Action, food: StageItem[]) =>
    sequence.push({ after, ...state(aria, leon, food), extras: cue.extras });
  if (line === 0) {
    start = state("idle", "reach", [
      { ...loaf("aria"), image: undefined },
      { ...loaf("leon"), image: undefined },
    ]);
    step(900, "idle", "reach", [loaf("aria"), loaf("leon")]);
    step(1600, "idle", "idle", [loaf("aria"), loaf("leon")]);
  }
  if (line === 5) {
    const offered = portions("aria", "offer").map((i) => ({
      ...i,
      actor: "leon" as const,
      wristOffset: { bottom: i.wristOffset?.bottom ?? 0, x: 3 - (i.wristOffset?.x ?? 0) },
    }));
    start = state("offer", "offer", [...offered, ...onCloth("leon")]);
    step(1000, "offer", "offer", [...portions("aria", "offer"), ...onCloth("leon")]);
    step(1800, "lap", "idle", held("lap", "idle"));
  }
  if (line === 10) {
    step(500, "bite", "idle", [...portions("aria", "bite"), ...onCloth("leon")]);
    step(1300, "lap", "reach", [...portions("aria", "lap", true), ...onCloth("leon")]);
    step(1800, "lap", "lap", [...portions("aria", "lap", true), ...portions("leon", "lap")]);
    step(2400, "lap", "bite", [...portions("aria", "lap", true), ...portions("leon", "bite")]);
    step(3200, "lap", "lap", [...portions("aria", "lap", true), ...portions("leon", "lap", true)]);
  }
  if (line === 16) {
    start = state("reach", "reach", [
      ...portions("aria", "reach", true),
      ...portions("leon", "reach", true),
    ]);
    step(650, "reach", "reach", [...onCloth("aria", true), ...onCloth("leon", true)]);
    step(1400, "idle", "idle", [...onCloth("aria", true), ...onCloth("leon", true)]);
  }
  return {
    ...cue,
    ...start,
    cell: 21,
    cameraScale: 0.72,
    initial: { aria: 43, leon: 52 },
    sequence: sequence.length ? sequence : undefined,
    finishBeforeAdvance: sequence.length > 0,
  };
}
