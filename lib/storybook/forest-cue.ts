import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { forestClothBorrow, forestClothReturn } from "./forest-handoff.ts";
import { forestCollectionCue } from "./forest-collection.ts";

export function forestDepartureCue(cue: StoryStageCue, line?: number): StoryStageCue {
  const registered = nightStudyCue(cue);
  const result: StoryStageCue = {
    ...registered,
    actors: registered.actors.map((actor) => ({
      ...actor,
      carry: registered.items?.some((item) => item.actor === actor.id) ?? false,
    })),
    items: forestDayBag(
      registered.items?.map((item) => {
        if (item.art === "moss-jar") {
          const cloth = registered.items?.some(
            (other) => other.art === "cloth" && other.actor === item.actor,
          );
          return { ...item, wristOffset: { x: 0, bottom: cloth ? 3 : 0 } };
        }
        return item.actor && ["cloth", "dish"].includes(item.art)
          ? { ...item, x: 0, bottom: 0, width: 5, wrist: true, wristAnchor: "bottom" as const }
          : item;
      }) ?? [],
    ),
  };
  if (line === 4) return forestClothReturn(result);
  return line === 16 ? forestClothBorrow(result) : result;
}

/** Personal supplies stay in Leon's small bag rather than floating as a tool pile. */
function forestDayBag(items: StageItem[]): StageItem[] {
  const rope = items.some((item) => item.id === "supplies");
  const bag: StageItem = {
    id: "forest-day-bag",
    art: "delivery-bag",
    actor: "leon",
    x: 2.7,
    bottom: 26,
    width: 4.8,
    behindOwner: false,
  };
  return [
    ...items.filter((item) => item.id !== "supplies"),
    bag,
    ...(rope
      ? [{ id: "supplies", art: "twine" as const, carrier: bag.id, x: 0, bottom: 4.3, width: 2.6 }]
      : []),
  ];
}

/** Specimens stay beside the root, at hand-sized scale, until the still takes over. */
export function forestStudyCue(cue: StoryStageCue, line: number): StoryStageCue {
  const positions: Record<string, number> = { sample: 29.5, colony: 10, forest: 35.5 };
  const jar: StageItem = { id: "tower-jar", art: "moss-jar", x: 24.8, bottom: 47, width: 3.5 };
  const result = {
    ...cue,
    actors: cue.actors.map((actor) => ({ ...actor, x: actor.id === "aria" ? 18 : 43, bottom: 50 })),
    initial: { aria: 18, leon: 43 },
    initialBottom: { aria: 50, leon: 50 },
    items: [
      ...(cue.items ?? []).map((item) => ({
        ...item,
        x: positions[item.id] ?? item.x,
        bottom: 50,
        width: 5.5,
      })),
      jar,
    ],
  };
  return line === 0 ? forestJarTransfer(result) : line === 4 ? forestCollectionCue(result) : result;
}

function forestJarTransfer(cue: StoryStageCue): StoryStageCue {
  const actors = (pose?: StageActor["mossStudy"]) =>
    cue.actors.map((actor) => (actor.id === "aria" ? { ...actor, mossStudy: pose } : actor));
  const items = (filled: boolean) =>
    (cue.items ?? []).map((item): StageItem =>
      item.id === "sample" ? { ...item, art: filled ? "moss" : "dish" } : item,
    );
  return {
    ...cue,
    actors: actors("reach"),
    items: items(false),
    finishBeforeAdvance: true,
    sequence: [
      { after: 850, actors: actors("show"), items: items(false), extras: cue.extras },
      { after: 1550, actors: actors("spread"), items: items(false), extras: cue.extras },
      { after: 2300, actors: actors("spread"), items: items(true), extras: cue.extras },
      { after: 3000, actors: actors(), items: items(true), extras: cue.extras },
    ],
  };
}
