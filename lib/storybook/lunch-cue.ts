import type { StageActor, StageItem, StageMoment, StoryStageCue } from "../story-stage-cues.ts";

type Action = NonNullable<StageActor["snackAction"]>;
export { actor as lunchActor, contact as lunchContact };
type Owner = "aria" | "leon";
const palms: Record<Owner, Record<Action, [number, number]>> = {
  aria: {
    idle: [68, 92],
    lap: [72.67, 93.33],
    offer: [80, 84.67],
    bite: [62.67, 82.67],
    reach: [86, 116.67],
    split: [70, 114.67],
    drink: [70, 114.67],
  },
  leon: {
    idle: [68, 90],
    lap: [70, 92],
    offer: [84, 84],
    bite: [63.33, 76.67],
    reach: [86.67, 114],
    split: [73.33, 116],
    drink: [73.33, 116],
  },
};
const floor = (
  id: string,
  art: StageItem["art"],
  x: number,
  bottom: number,
  width: number,
): StageItem => ({ id, art, x, bottom, width, travelMs: 0 });
function held(id: string, art: StageItem["art"], actor: Owner, width = 3.6): StageItem {
  const flask = art === "travel-flask";
  return {
    id,
    art,
    actor,
    x: 0,
    bottom: 0,
    width,
    wrist: true,
    travelMs: 0,
    wristAnchor: flask ? "top" : "bottom",
    wristOffset: { x: 0, bottom: flask ? width * 1.5 * (1 - 855 / 762) : -1 },
  };
}
function contact(item: StageItem, action: Action): StageItem {
  const owner = item.actor as Owner,
    p = palms[owner][action],
    width = item.width ?? 2.8;
  return {
    ...item,
    actor: undefined,
    wrist: false,
    x:
      (owner === "aria" ? 43 : 52) +
      (((p[0] - 64) * 21) / 128 + (item.wristOffset?.x ?? 0)) * (owner === "aria" ? 1 : -1),
    bottom:
      24 +
      (((128 - p[1]) * 21) / 128) * 1.5 -
      (item.wristAnchor === "top" ? width * 1.5 : 0) +
      (item.wristOffset?.bottom ?? 0),
  };
}
function actor(a: StageActor, action: Action, otherHand = false): StageActor {
  return {
    ...a,
    x: a.id === "aria" ? 43 : 52,
    bottom: 24,
    left: a.id === "leon",
    seated: true,
    inspect: false,
    packing: false,
    snackAction: action,
    nameAbove: true,
    nameOffset: a.id === "aria" ? -12 : 12,
    wristPoints: Object.fromEntries(
      Array.from({ length: 88 }, (_, i) => [
        i,
        otherHand ? [58.67, 92] : palms[a.id as Owner][action],
      ]),
    ),
  };
}
const shared = () => held("shared-cake", "honey-cake", "aria");
const own = () => held("aria-cake", "honey-cake", "aria");
const flask = () => held("travel-flask", "travel-flask", "leon", 2.7);
function items(line: number): StageItem[] {
  const result = [
    floor("picnic-cloth", "picnic-cloth", 48, 19, 24),
    floor("basket", "basket", 37, 24, 6),
  ];
  result.push(floor("bread", "bread", 50.5, 21, 4.8));
  if (line < 28) result.push(floor("walnut-cake", "walnut-cake", 47.8, 24, 3));
  if (line < 11) result.push(contact(shared(), "reach"));
  else if (line < 15) result.push({ ...shared(), actor: "leon" });
  if (line < 15) result.push(contact(own(), "split"));
  if (line >= 6) result.push(contact(flask(), "reach"));
  if (line >= 28) result.push(floor("cake-parcel", "cake-parcel", 44.5, 25, 4.5));
  return result;
}
export function lunchStudyCue(cue: StoryStageCue, line: number): StoryStageCue {
  const state = lunchState(cue, line);
  const steps: StageMoment[] = [];
  const step = (after: number, aria: Action, leon: Action, props?: StageItem[]) =>
    steps.push({ after, ...state(aria, leon, props) });
  let start = state("idle", line >= 11 && line < 15 ? "lap" : "idle");
  const without = (...ids: string[]) => items(line).filter((i) => !ids.includes(i.id));
  if (line === 0) {
    start = state(
      "split",
      "idle",
      items(line).filter((i) => ["picnic-cloth", "basket"].includes(i.id)),
    );
    step(900, "split", "idle");
    step(1600, "idle", "idle");
  }
  if (line === 6) {
    const props = without("travel-flask");
    start = state("idle", "lap", [...props, flask()]);
    step(600, "idle", "reach", [...props, flask()]);
    step(1200, "idle", "reach");
    step(1700, "idle", "idle");
  }
  if (line === 11) {
    const props = without("shared-cake");
    start = state("reach", "idle", [...props, contact(shared(), "reach")]);
    step(300, "reach", "offer", [...props, shared()]);
    step(900, "offer", "offer", [...props, shared()]);
    step(1500, "offer", "offer", [...props, { ...shared(), actor: "leon" }]);
    step(2300, "idle", "lap");
  }
  if (line === 15) {
    start = eating(state, step, without("shared-cake", "aria-cake"));
  }
  if (line === 20) {
    start = state("reach", "idle");
    step(900, "idle", "idle");
  }
  if (line === 28) {
    const props = without("cake-parcel");
    const twine = held("twine", "twine", "leon", 2.8);
    const cloth = floor("packing-cloth", "packing-cloth", 44.5, 24, 6);
    start = state("offer", "offer", [...props, cloth, twine]);
    step(650, "offer", "offer", [...props, cloth, { ...twine, actor: "aria" }]);
    step(1400, "split", "idle", [...props, cloth, { ...twine, actor: "aria" }]);
    step(2300, "split", "idle");
    step(3100, "idle", "idle");
  }
  return {
    ...cue,
    ...start,
    initial: { aria: 43, leon: 52 },
    cell: 21,
    cameraScale: 0.72,
    sequence: steps.length ? steps : undefined,
    finishBeforeAdvance: steps.length > 0,
  };
}
type LunchState = Pick<StageMoment, "actors" | "items">;
type State = (aria: Action, leon: Action, props?: StageItem[]) => LunchState;
type Step = (after: number, aria: Action, leon: Action, props?: StageItem[]) => unknown;
function lunchState(cue: StoryStageCue, line: number): State {
  return (aria, leon, props = items(line)) => ({
    actors: cue.actors.map((a) =>
      actor(a, a.id === "aria" ? aria : leon, line === 15 && a.id === "leon" && leon === "reach"),
    ),
    items: props.map((item) => {
      if (!item.wrist || item.art === "travel-flask") return item;
      const action = item.actor === "aria" ? aria : leon;
      return { ...item, wristOffset: { x: action === "offer" ? 1.5 : 0, bottom: -1 } };
    }),
  });
}
function eating(state: State, step: Step, props: StageItem[]) {
  const cakes = (bitten = false) =>
    [own(), { ...shared(), actor: "leon" as const }].map((i) => ({
      ...i,
      art: bitten ? ("honey-cake-bitten" as const) : i.art,
    }));
  step(250, "split", "lap", [...props, ...cakes()]);
  step(500, "lap", "lap", [...props, ...cakes()]);
  step(900, "bite", "bite", [...props, ...cakes()]);
  step(1600, "lap", "lap", [...props, ...cakes(true)]);
  step(1900, "lap", "reach", [...props, ...cakes(true)]);
  step(2200, "lap", "lap", [...props, ...cakes(true)]);
  step(2400, "bite", "bite", [...props, ...cakes(true)]);
  step(3400, "idle", "idle", props);
  return state("split", "lap", [...props, contact(own(), "split"), { ...shared(), actor: "leon" }]);
}
