export const residentIds = ["leon", "aria", "mira", "finn", "lico"] as const;
export type ResidentId = (typeof residentIds)[number];
// Filter the source once to a shared pixel grid; enlarge without smoothing.
// Keep two texture pixels per displayed pixel so small faces remain readable.
export const residentArt = { cell: 128, height: 96, foot: 120, displayCell: 64, frames: 16 };
export const residentHeight = (residentArt.height / residentArt.cell) * residentArt.displayCell;
export const residentSolePadding =
  ((residentArt.cell - residentArt.foot) / residentArt.cell) * residentArt.displayCell;
export const residentScale = residentHeight / 60;
export const residentActions = { frames: 12, rearWalkFrames: 6 };
// Four poses per authored direction; do not mirror the drinking hand.
export const residentTea = { frames: 8, poses: 4, duration: 8000, step: 2000 };
export const teaFrame = (time: number, left = false, reduced = false) =>
  (reduced
    ? 0
    : Math.floor(
        (((time % residentTea.duration) + residentTea.duration) % residentTea.duration) /
          residentTea.step,
      )) + (left ? residentTea.poses : 0);
export const residentHand = (id: ResidentId) => (id === "lico" ? "left" : "right");
export function residentAtlas(
  id: ResidentId,
  pose: ResidentPose,
  frame: number,
  action: boolean,
  left: boolean,
) {
  if (pose === "tea")
    return { name: `${id}-tea`, frame: frame + (left ? residentTea.poses : 0), flip: false };
  return { name: action ? `${id}-actions` : id, frame, flip: !action && left };
}
export const walkFrame = (distance: number, reduced = false) =>
  reduced ? 0 : Math.floor(distance / 3) % 8;
export function residentAnimation(
  pose: ResidentPose,
  time: number,
  distance: number,
  reduced: boolean,
  rear = false,
) {
  const action =
    pose === "tea" || pose === "craft" || pose === "paper" || (pose === "walk" && rear);
  const t = reduced ? 0 : time;
  // Preserve face proportions. Whole-sprite vertical compression made cheeks
  // look wider and resampled the pixel grid every tick. A half-pixel rise at
  // passing is one delivery pixel, with the contact pose on the floor.
  const bob =
    pose === "walk" && !reduced
      ? -Math.round((1 - Math.cos((distance / 12) * Math.PI * 2)) / 2) * 0.5
      : 0;
  if (action) {
    return { frame: actionFrame(pose, t, reduced ? 0 : distance), bob, action: true };
  }
  return {
    frame: pose === "walk" ? walkFrame(distance, reduced) : residentFrame(pose, time, reduced),
    bob,
    action: false,
  };
}
function actionFrame(pose: ResidentPose, time: number, distance: number) {
  switch (pose) {
    case "walk":
      return Math.floor(distance / 4) % residentActions.rearWalkFrames;
    case "tea":
      return teaFrame(time);
    case "craft":
      return 8 + (Math.floor(time / 440) % 2);
    default:
      return 10 + (Math.floor(time / 1100) % 2);
  }
}
export type ResidentPose = "idle" | "walk" | "wave" | "tea" | "craft" | "garden" | "paper";
export const residentNames: Record<ResidentId, string> = {
  leon: "レオン",
  aria: "アリア",
  mira: "ミラ",
  finn: "フィン",
  lico: "リコ",
};
export const poseLabels: Record<ResidentPose, string> = {
  idle: "ひと休み",
  walk: "移動中",
  wave: "ごあいさつ",
  tea: "お茶の時間",
  craft: "作業中",
  garden: "菜園のお世話",
  paper: "依頼の手紙を整理中",
};
// Whole-body frames share one contract; adventures and dialogue can use it without room logic.
export function residentFrame(pose: ResidentPose, time: number, reduced = false) {
  const t = reduced ? 0 : time;
  switch (pose) {
    case "walk":
      return Math.floor(t / 100) % 8;
    case "wave":
      return 9;
    case "tea":
      return 10 + (t % 6400 > 4200 ? 1 : 0);
    case "craft":
      return 12 + (Math.floor(t / 440) % 2);
    case "garden":
      return 14;
    case "paper":
      return 15;
    default:
      return 8;
  }
}
