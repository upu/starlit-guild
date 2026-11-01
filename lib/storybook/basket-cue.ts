import type { StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { waterwayClothCue } from "./waterway-cloth.ts";

export const basketStories = [
  "tower-restoration-departure",
  "tower-restoration-return",
  "tower-moss-removal-departure",
];

/** A shallow basket rests on the same registered palms when standing and walking. */
export function basketStudyCue(cue: StoryStageCue, id: string, line = Infinity): StoryStageCue {
  const painted = nightStudyCue(cue);
  const leaveBasket = id === "tower-restoration-departure" && line >= 14;
  const items = painted.items?.map((item) => {
    if (item.art === "cloth" && item.actor)
      return { ...item, x: 0, bottom: 0, width: 5, wrist: true, wristAnchor: "bottom" as const };
    if (item.art !== "basket") return item;
    if (leaveBasket) return { ...item, actor: undefined, x: 51, bottom: 14, width: 8 };
    if (!item.actor)
      return { ...item, width: 8, bottom: id === "tower-restoration-return" ? 6 : item.bottom };
    return {
      ...item,
      x: 0,
      bottom: 0,
      width: 8,
      wrist: true,
      wristAnchor: "bottom" as const,
      wristOffset: { x: 2, bottom: 0 },
    };
  });
  const result = {
    ...painted,
    items,
    actors: painted.actors.map((actor) => ({
      ...actor,
      carry:
        items?.some((item) => ["basket", "cloth"].includes(item.art) && item.actor === actor.id) ??
        false,
    })),
  };
  return id === "tower-restoration-return" && line === 13 ? waterwayClothCue(result) : result;
}
