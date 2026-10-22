import type { StageItem, StageExtra } from "./story-stage-cues.ts";

/** Authored widths describe the body, not the transparent padding of a motion cell. */
export function stageFigure(item: StageItem, moving: boolean, elapsed: number) {
  if (item.art !== "golem" && item.art !== "puppet") return null;
  const referenceWidth = item.art === "golem" ? 432 : 312;
  const width = item.width ?? 10;
  const step = Math.floor(elapsed / (item.art === "golem" ? 180 : 130)) % 4;
  return {
    width: (width * 512) / referenceWidth,
    footPadding: (width * 32 * 1.5) / referenceWidth,
    frame: moving
      ? 1 + (item.backstep ? (4 - step) % 4 : step)
      : { idle: 0, kneel: 5, bow: 6, recoil: 7 }[item.figure ?? "idle"],
  };
}

const poses = { idle: 0, explain: 1, point: 2, wave: 3 };
const beds = { rest: 4, listen: 5, ask: 6, nod: 7 };
export function stageExtraFrame(extra: StageExtra, moving = false, elapsed = 0) {
  if (extra.id === "parent") return parentFrame(extra, moving, elapsed);
  if (extra.id === "worker") return workerFrame(extra, moving, elapsed);
  if (extra.id === "masked-pumpety") {
    if (moving) return 4 + (Math.floor(elapsed / 160) % 4);
    if (extra.bow) return { shallow: 8, deep: 9 }[extra.bow];
  }
  if (extra.id === "child" && extra.bed) return beds[extra.bed];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
}

export function stageExtraRows(extra: StageExtra) {
  if (["masked-pumpety", "worker"].includes(extra.id)) return 3;
  return ["child", "keeper", "merchant", "parent"].includes(extra.id) ? 2 : 1;
}

function parentFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (!moving) return poses[extra.pose ?? "idle"];
  const phase = elapsed % 760;
  return extra.limp
    ? 4 + [260, 380, 620, 760].findIndex((end) => phase < end)
    : 4 + (Math.floor(elapsed / 180) % 4);
}

function workerFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return 4 + (Math.floor(elapsed / 180) % 4);
  if (extra.writing) return 8 + (Math.floor(elapsed / 320) % 2);
  if (extra.inspect) return 10;
  return extra.carry ? 11 : poses[extra.pose ?? "idle"];
}
