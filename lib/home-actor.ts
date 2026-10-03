export const residentIds = ["leon", "aria", "mira", "finn", "lico"] as const;
export type ResidentId = (typeof residentIds)[number];
// Texture pixels are independent of world/display size. Keep the painted face
// intact at desktop and high-DPR sizes instead of reducing it to 60 source pixels.
export const residentArt = { cell: 320, height: 240, foot: 304, displayCell: 80, frames: 16 };
export const residentActions = { frames: 12, rearWalkFrames: 6 };
export const residentHand = (id: ResidentId) => (id === "lico" ? "left" : "right");
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
  if (action) {
    return { frame: actionFrame(pose, t, reduced ? 0 : distance), bob: 0, action: true };
  }
  return {
    frame: pose === "walk" ? walkFrame(distance, reduced) : residentFrame(pose, time, reduced),
    bob: 0,
    action: false,
  };
}
function actionFrame(pose: ResidentPose, time: number, distance: number) {
  switch (pose) {
    case "walk":
      return Math.floor(distance / 4) % residentActions.rearWalkFrames;
    case "tea":
      return 6 + (time % 6400 > 4200 ? 1 : 0);
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
