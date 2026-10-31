import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { herbReturnCue } from "./herb-return.ts";

function bedsideItem(item: StageItem): StageItem {
  if (item.art === "herbs" && item.actor)
    return {
      ...item,
      width: Math.min(item.width ?? 5, 5),
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
    };
  if (item.art === "herbs") return { ...item, width: Math.min(item.width ?? 6, 6) };
  // Breakfast rests on the painted bedside table, to the left of the pillow.
  if (!item.actor && item.x === 92 && ["dish", "bread"].includes(item.art))
    return { ...item, x: 61, bottom: item.art === "bread" ? 85 : 84 };
  // Painted seated sprites contain no chair; retain the separate furniture.
  if (item.art === "chair") return { ...item, seatFor: undefined, width: 8.5 };
  return item;
}

export function medicineRoomCue(cue: StoryStageCue, id?: string, line = 0): StoryStageCue {
  if (id === "moonlit-herbs-return") cue = herbReturnCue(cue, line);
  return {
    ...cue,
    actors: medicineActors(cue),
    items: cue.items && medicineItems(cue.items),
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: medicineActors({ ...cue, actors: step.actors }),
      items: medicineItems(step.items),
    })),
  };
}

function medicineActors(cue: StoryStageCue): StageActor[] {
  const hands = nightStudyCue(cue).actors;
  return cue.actors.map((actor, index) =>
    actor.id === "mira"
      ? { ...actor, wristPoints: { ...actor.wristPoints, 4: [47, 80] } }
      : hands[index],
  );
}

function medicineItems(items: StageItem[]) {
  const table = items.find((item) => item.art === "table");
  return items.map((item) => {
    const adjusted = bedsideItem(item);
    return table && ["herbs", "cloth"].includes(item.art) && item.support === "table"
      ? { ...adjusted, bottom: table.bottom + (table.width ?? 21) * 0.62 }
      : adjusted;
  });
}
