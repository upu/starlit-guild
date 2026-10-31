import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";

export function herbReturnCue(cue: StoryStageCue, line: number): StoryStageCue {
  const items: StageItem[] = (cue.items ?? [])
    .filter((item) => !["medicine", "herbs"].includes(item.art))
    .map((item) => (item.art === "table" ? { ...item, width: 21 } : item));
  items.push(
    { id: "herbs", art: "herbs", x: 61, bottom: 29, width: 3.5, support: "table" },
    { id: "slope-herbs", art: "herbs", x: 56, bottom: 29, width: 3.5, support: "table" },
    { id: "reward-pouch", art: "honey-bag", x: 66, bottom: 30, width: 4, support: "table" },
    {
      id: "healing-bottle",
      art: "medicine-packet",
      x: 62,
      bottom: 34,
      width: 3.5,
      support: "table",
    },
  );
  if (line !== 0) return { ...cue, items };
  const holding = cue.actors.map((actor) =>
    actor.id === "leon" ? { ...actor, x: 52, bottom: 14, left: false, carry: true } : actor,
  );
  const released = holding.map((actor) =>
    actor.id === "leon" ? { ...actor, carry: false, pose: "offer" as const } : actor,
  );
  return {
    ...cue,
    actors: holding,
    finishBeforeAdvance: true,
    items: items.map((item) =>
      item.id === "slope-herbs"
        ? { ...item, actor: "leon", x: 0, bottom: 0, support: undefined }
        : item,
    ),
    sequence: [
      { after: 1000, actors: released, items, extras: cue.extras },
      { after: 1800, actors: cue.actors, items, extras: cue.extras },
    ],
  };
}
