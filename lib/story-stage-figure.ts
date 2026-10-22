import type { StageItem, StageExtra } from "./story-stage-cues.ts";

/** Authored widths describe the body, not the transparent padding of a motion cell. */
export function stageFigure(item: StageItem, moving: boolean, elapsed: number) {
  if (item.art !== "golem" && item.art !== "puppet") return null;
  const referenceWidth = item.art === "golem" ? 432 : 312;
  const width = item.width ?? 10;
  return {
    width: (width * 512) / referenceWidth,
    footPadding: (width * 32 * 1.5) / referenceWidth,
    frame: moving
      ? 1 + (Math.floor(elapsed / (item.art === "golem" ? 180 : 130)) % 4)
      : { idle: 0, kneel: 5, bow: 6 }[item.figure ?? "idle"],
  };
}

const poses = { idle: 0, explain: 1, point: 2, wave: 3 };
const beds = { rest: 4, listen: 5, ask: 6, nod: 7 };
export function stageExtraFrame(extra: StageExtra, moving = false, elapsed = 0) {
  if (extra.id === "masked-pumpety") {
    if (moving) return 4 + (Math.floor(elapsed / 160) % 4);
    if (extra.bow) return { shallow: 8, deep: 9 }[extra.bow];
  }
  if (extra.id === "child" && extra.bed) return beds[extra.bed];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
}

export function stageExtraRows(extra: StageExtra) {
  if (extra.id === "masked-pumpety") return 3;
  return ["child", "keeper", "merchant"].includes(extra.id) ? 2 : 1;
}
