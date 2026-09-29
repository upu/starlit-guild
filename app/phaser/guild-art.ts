import { guildArtFrames } from "@/lib/guild-art-frames";
import {
  miraFrames,
  packingFrames,
  pushFrames,
  roadFrame,
  roadSheet,
  roadWalkSheet,
  walkBounds,
} from "./road-art";
import type { TravellerId } from "@/lib/road-view";
export type GuildPoseKind = "idle" | "walk" | "tend" | "craft";
export const guildIds: readonly TravellerId[] = ["aria", "leon", "mira", "finn", "lico"];
export function guildPose(id: TravellerId, mode: GuildPoseKind, step: number) {
  if (id === "finn" || id === "lico") return lifePose(id, mode, step);
  if (mode === "walk") {
    const [x, y, right, bottom] = walkBounds[id][step % 4];
    return {
      asset: roadWalkSheet(id),
      rect: [(step % 2) * 627 + x, Math.floor((step % 4) / 2) * 627 + y, right - x, bottom - y],
      width: 1254,
      height: 1254,
      scale: 1 / 550,
    };
  }
  if (mode === "craft" || mode === "tend") return workPose(id, mode === "craft", step);
  const frame = roadFrame(id, 8);
  return {
    asset: roadSheet(id),
    rect: id === "mira" ? miraFrames[8] : [frame.left, frame.top, frame.width, frame.height],
    width: id === "mira" ? 1254 : 1448,
    height: id === "mira" ? 1254 : 1086,
    scale: 1 / (id === "mira" ? 285 : 350),
  };
}
export const guildPropsAsset = "/guild/props-v2.webp";
export const guildPropFrames = guildArtFrames["props-v2"];

function lifePose(id: "finn" | "lico", mode: GuildPoseKind, step: number) {
  const name = `${id}-guild-v2` as const;
  const indexes = { walk: step % 4, craft: 6 + (step % 2), tend: 5, idle: 4 };
  return {
    asset: `/guild/${name}.webp`,
    rect: [...guildArtFrames[name][indexes[mode]]],
    width: 1536,
    height: 1024,
    scale: 1 / (id === "finn" ? 479 : 495),
  };
}
function workPose(id: "aria" | "leon" | "mira", craft: boolean, step: number) {
  return {
    asset: `/animations/road/${craft ? "push" : "packing"}-v1.webp`,
    rect: (craft ? pushFrames : packingFrames)[id][step % 2],
    width: craft ? 1024 : 1295,
    height: craft ? 1536 : 1214,
    scale: 1 / (craft ? 475 : 390),
  };
}
