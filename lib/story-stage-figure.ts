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
  if (extra.id === "stone-carrier") return stoneCarrierFrame(extra, moving, elapsed);
  if (extra.id === "parent") return parentFrame(extra, moving, elapsed);
  if (extra.id === "worker") return workerFrame(extra, moving, elapsed);
  if (extra.id === "cook") return cookFrame(extra, moving, elapsed);
  if (extra.id === "merchant" && moving) return 8 + (Math.floor(elapsed / 180) % 4);
  if (extra.id === "masked-pumpety") return maskedFrame(extra, moving, elapsed);
  if (extra.id === "child" && extra.bed) return beds[extra.bed];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
}

function stoneCarrierFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return Math.floor(elapsed / 180) % 4;
  if (extra.care) return { sore: 4, palm: 5, bandaged: 6, rest: 7 }[extra.care];
  return 1;
}

function maskedFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return 4 + (Math.floor(elapsed / 160) % 4);
  return extra.bow ? { shallow: 8, deep: 9 }[extra.bow] : poses[extra.pose ?? "idle"];
}
function cookFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return 4 + (Math.floor(elapsed / 180) % 4);
  if (extra.kitchen) return { pot: 12, lid: 13, inspect: 14, cloth: 15 }[extra.kitchen];
  if (extra.grip) return extra.grip === "reach" ? 8 : 9;
  return extra.pose === "explain" || extra.pose === "point" ? 10 : 11;
}

export function stageExtraRows(extra: StageExtra) {
  if (extra.id === "worker" || extra.id === "cook") return 4;
  if (extra.id === "merchant") return 3;
  if (extra.id === "masked-pumpety") return 3;
  return ["child", "keeper", "merchant", "parent", "stone-carrier"].includes(extra.id) ? 2 : 1;
}

function parentFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (!moving) return poses[extra.pose ?? "idle"];
  const phase = elapsed % 760;
  return extra.limp
    ? 4 + [260, 380, 620, 760].findIndex((end) => phase < end)
    : 4 + (Math.floor(elapsed / 180) % 4);
}

function workerFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) {
    const phase = elapsed % 760;
    return (
      4 +
      (extra.limp
        ? [260, 380, 620, 760].findIndex((end) => phase < end)
        : Math.floor(elapsed / 180) % 4)
    );
  }
  if (extra.hatGreeting) return 12;
  if (extra.writing) return 8 + (Math.floor(elapsed / 320) % 2);
  if (extra.inspect) return 10;
  if (extra.carry) return 11;
  return extra.limp && (!extra.pose || extra.pose === "idle") ? 5 : poses[extra.pose ?? "idle"];
}
