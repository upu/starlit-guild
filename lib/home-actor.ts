export const residentIds = ["leon", "aria", "mira", "finn", "lico"] as const;
export type ResidentId = (typeof residentIds)[number];
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
      return Math.floor(t / 160) % 4;
    case "wave":
      return 5;
    case "tea":
      return 6 + (t % 6400 > 4200 ? 1 : 0);
    case "craft":
      return 8 + (Math.floor(t / 440) % 2);
    case "garden":
      return 10;
    case "paper":
      return 11;
    default:
      return 4;
  }
}
