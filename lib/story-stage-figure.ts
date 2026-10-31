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
export const stageExtraAtlas = (extra: StageExtra) =>
  extra.id === "fence-carrier" ? "stone-carrier" : extra.id;
const beds = { rest: 4, listen: 5, ask: 6, nod: 7 };
const extraFrames: Partial<
  Record<StageExtra["id"], (extra: StageExtra, moving: boolean, elapsed: number) => number>
> = {
  "stone-carrier": stoneCarrierFrame,
  keeper: keeperFrame,
  merchant: merchantFrame,
  parent: parentFrame,
  worker: workerFrame,
  cook: cookFrame,
  doctor: doctorFrame,
  "masked-pumpety": maskedFrame,
  merrill: merrillFrame,
};
export function stageExtraFrame(extra: StageExtra, moving = false, elapsed = 0) {
  if (moving && extra.walkFrames) return extra.walkFrames[Math.floor(elapsed / 180) % 4];
  const selectFrame = extraFrames[stageExtraAtlas(extra)];
  if (selectFrame) return selectFrame(extra, moving, elapsed);
  if (extra.id === "child" && extra.bed) return beds[extra.bed];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
}

function stoneCarrierFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return Math.floor(elapsed / 180) % 4;
  if (extra.care) return { sore: 4, palm: 5, bandaged: 6, rest: 7 }[extra.care];
  return 1;
}

function keeperFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  const basket = keeperTaskFrame(extra, moving, elapsed);
  if (basket !== undefined) return basket;
  if (moving) return 8 + (Math.floor(elapsed / 180) % 4);
  if (extra.deskWork)
    return extra.deskWork === "write"
      ? 17 + (Math.floor(elapsed / 420) % 2)
      : extra.deskWork === "hold"
        ? 19
        : 16;
  if (extra.restoration) return { trace: 12, touch: 13, read: 14, receive: 15 }[extra.restoration];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
}

function keeperTaskFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (extra.towerSignal && !moving) return extra.towerSignal === "look" ? 40 : 41;
  const lantern = keeperLanternFrame(extra, moving);
  if (lantern !== undefined) return lantern;
  const opening = keeperOpeningFrame(extra, moving, elapsed);
  if (opening !== undefined) return opening;
  if (extra.hatchMark && !moving)
    return { idle: 24, touch: 25, stroke: 26, rest: 27 }[extra.hatchMark];
  if (!extra.basketHandoff || (moving && extra.basketHandoff === "idle")) return undefined;
  return { reach: 20, lift: 21, offer: 22, idle: 23 }[extra.basketHandoff];
}

function keeperLanternFrame(extra: StageExtra, moving: boolean) {
  if (!extra.lanternHandling || (moving && extra.lanternHandling === "hold")) return undefined;
  return { low: 36, rise: 37, lift: 38, hold: 39 }[extra.lanternHandling];
}

function keeperOpeningFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (!extra.hatchOpening) return undefined;
  if (moving && extra.carry) return 32 + (Math.floor(elapsed / 180) % 4);
  if (extra.hatchOpening === "idle" && moving) return undefined;
  return { idle: 28, grip: 29, lift: 30, hold: 31 }[extra.hatchOpening];
}

function merchantFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return 8 + (Math.floor(elapsed / 180) % 4);
  if (extra.unloading) return { reach: 20, idle: 21, front: 22, right: 23 }[extra.unloading];
  if (extra.deskWork)
    return extra.deskWork === "count"
      ? 17 + (Math.floor(elapsed / 420) % 2)
      : extra.deskWork === "stow"
        ? 19
        : 16;
  if (extra.service) return { carry: 12, place: 13, raise: 14, talk: 15 }[extra.service];
  return poses[extra.pose ?? "idle"] + (extra.chair ? 4 : 0);
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
  if (extra.id === "merrill" && extra.walkFrames) return 4;
  if (extra.id === "merrill") return 3;
  if (extra.id === "doctor") return 3;
  if (extra.id === "worker") return 6;
  if (extra.id === "cook") return 4;
  if (extra.id === "keeper" || extra.id === "merchant") return 5;
  if (extra.id === "masked-pumpety") return 3;
  return ["child", "merchant", "parent", "stone-carrier", "fence-carrier"].includes(extra.id)
    ? 2
    : 1;
}
function merrillFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving || !extra.seedlingAction) return poses[extra.pose ?? "idle"];
  if (extra.seedlingAction === "play") return 6 + (Math.floor(elapsed / 280) % 2);
  return { pick: 4, taste: 5, receive: 8, stow: 9, collect: 10, pot: 11 }[extra.seedlingAction];
}
function doctorFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (extra.doctorBag) return 8 + ["nod", "grasp", "lift", "hold"].indexOf(extra.doctorBag);
  if (extra.writing && !moving) return 4 + (Math.floor(elapsed / 320) % 2);
  if (extra.notebook) return extra.pose === "explain" || extra.pose === "point" ? 7 : 6;
  return poses[extra.pose ?? "idle"];
}

function parentFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (!moving) return poses[extra.pose ?? "idle"];
  const phase = elapsed % 760;
  return extra.limp
    ? 4 + [260, 380, 620, 760].findIndex((end) => phase < end)
    : 4 + (Math.floor(elapsed / 180) % 4);
}

function workerFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (extra.pullCart) return 20 + (moving ? Math.floor(elapsed / 180) % 4 : 0);
  return workerTaskFrame(extra, moving, elapsed);
}
function workerTaskFrame(extra: StageExtra, moving: boolean, elapsed: number) {
  if (moving) return workerWalkFrame(extra, elapsed);
  const special = workerServiceFrame(extra);
  if (special !== null) return special;
  if (extra.hatGreeting) return hatGreetingFrame(extra.hatGreeting);
  if (extra.wiping) return 13 + (Math.floor(elapsed / 430) % 2);
  if (extra.writing) return 8 + (Math.floor(elapsed / 320) % 2);
  if (extra.notebook) return 8;
  if (extra.inspect) return 10;
  if (extra.carry) return 11;
  return extra.limp && (!extra.pose || extra.pose === "idle") ? 5 : poses[extra.pose ?? "idle"];
}
function workerServiceFrame(extra: StageExtra) {
  if (extra.oilPour) return 15;
  if (extra.showNotebook) return 19;
  return extra.dining ? 16 + ["hold", "sip", "reach"].indexOf(extra.dining) : null;
}
function hatGreetingFrame(greeting: StageExtra["hatGreeting"]) {
  return greeting === "lower" ? 24 : 12;
}
function workerWalkFrame(extra: StageExtra, elapsed: number) {
  const phase = elapsed % 760;
  return (
    4 +
    (extra.limp
      ? [260, 380, 620, 760].findIndex((end) => phase < end)
      : Math.floor(elapsed / 180) % 4)
  );
}
