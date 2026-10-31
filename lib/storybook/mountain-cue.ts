import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { mountainTeaCue } from "./mountain-tea.ts";
import { signpostStudyCue } from "./signpost-cue.ts";
import { blockadeForkStudyCue } from "./blockade-fork-cue.ts";
import { nightStudyCue } from "./night-cue.ts";

export function mountainStudyCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  if (cue.background === "mountain-fork-empty") return blockadeForkStudyCue(cue, line);
  if (id.startsWith("spinning-signpost-"))
    return signpostStudyCue(cue, line, id.endsWith("departure"));
  if (id === "mountain-entrance-return") return mountainTeaCue(mountainRestCue(cue), line);
  if (id !== "mountain-entrance-departure") return cue;
  cue = nightStudyCue(cue);
  const item = (prop: StageItem): StageItem => {
    if (prop.id !== "medicine") return prop;
    if (line < 6) return { ...prop, art: "medicine-closed", width: 8, x: 57, bottom: 6 };
    return {
      ...prop,
      art: prop.actor ? "medicine-closed" : "medicine",
      width: 8,
      ...(prop.actor ? { x: 0, bottom: 0, wrist: true, wristAnchor: undefined } : {}),
    };
  };
  const extras = cue.extras?.map((extra) =>
    extra.id === "worker" ? { ...extra, left: true } : extra,
  );
  return {
    ...cue,
    items: cue.items?.map(item),
    extras,
    sequence: cue.sequence?.map((step) => ({
      ...step,
      actors: nightStudyCue({ ...cue, actors: step.actors }).actors,
      items: step.items.map(item),
      extras: step.extras?.map((extra) =>
        extra.id === "worker" ? { ...extra, left: true } : extra,
      ),
    })),
  };
}

function restItem(item: StageItem): StageItem {
  if (item.id.startsWith("seat-")) return { ...item, width: 8, x: item.x + (item.left ? 1 : -1) };
  if (item.support === "tea-stone") return { ...item, bottom: 19 };
  return item;
}

function mountainRestCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    items: cue.items?.map(restItem),
    sequence: cue.sequence?.map((step) => ({ ...step, items: step.items.map(restItem) })),
  };
}
