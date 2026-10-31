import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";
import type { RoadLook } from "./road-look.ts";

// Share the elevated ground plane between figures, effects and pointer hit testing.
export const roadScale = (width: number, stage = "forest") =>
  RPG_CAMERA_SCALE * Math.min(1.4, width / (stage === "puppets" ? 800 : 560));
export const roadHeroSize = (width: number, height: number) =>
  RPG_CAMERA_SCALE * Math.min(128, width * 0.18, height * 0.34);
export const roadDepth = (width: number, height: number) =>
  Math.min(240, height * 0.65, width * 0.35) * RPG_CAMERA_SCALE;
export const roadY = (lane: number, height: number, width: number) =>
  height * 0.62 + (lane - 0.68) * roadDepth(width, height);
/** Keep portrait-site figures above the backdrop while sorting by their feet. */
export function roadFigureDepth(
  lane: number,
  view: { width: number; height: number },
  look?: RoadLook,
) {
  return elevatedGround(look)
    ? 5 + (20 * roadY(lane, view.height, view.width)) / view.height
    : 10 + lane * 10;
}
const elevatedSites = [
  "lindeDelivery",
  "lanternRoad",
  "brekkaLedger",
  "mossTrail",
  "mossBeds",
  "nightBridge",
  "restoration",
  "waterway",
  "packing",
  "signpost",
  "defense",
  "blockade",
] as const;
function elevatedGround(look?: RoadLook) {
  return !!look && elevatedSites.some((key) => !!look[key]);
}
export const roadX = (x: number, camera: number, width: number, stage = "forest") =>
  width * (stage === "puppets" ? 0.2 : 0.35) + (x - camera) * roadScale(width, stage);

// Painted scenes are not tileable. Pan within one oversized image, never wrap its edges.
export function roadBackdrop(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  progress: number,
) {
  // A portrait viewport must not magnify a house several times relative to the
  // actors. Keep the playable view near 3:2; a dim surround fills the spare height.
  const scale = (width * 1.025) / imageWidth;
  const w = imageWidth * scale,
    h = imageHeight * scale;
  return {
    width: w,
    height: h,
    x: -(w - width) * Math.max(0, Math.min(1, progress)),
    y: height * 0.62 - h * 0.7,
  };
}
