import { guildArtFrames } from "@/lib/guild-art-frames";
import { guildRoomArt } from "@/lib/guild-room-art";
import { guildRoomSprite } from "@/lib/guild-menu-model";
import {
  MINI_CELL,
  MINI_STANDING_HEIGHT,
  packingFrames,
  pushFrames,
  roadFrame,
  roadSheet,
  roadWalkSheet,
  walkBounds,
} from "./road-art";
import type { TravellerId } from "@/lib/road-view";
export type GuildPoseKind = "idle" | "walk" | "tend" | "craft" | "tea";
export const guildIds: readonly TravellerId[] = ["aria", "leon", "mira", "finn", "lico"];
export function guildPose(id: TravellerId, mode: GuildPoseKind, step: number) {
  if (mode === "tea") return roomPose("tea-party-v3", guildIds.indexOf(id) * 4, 4, step);
  if (id === "finn" || id === "lico") return lifePose(id, mode, step);
  if (id === "aria" || id === "mira") {
    const pose = mode === "walk" ? step % 4 : mode === "idle" ? 8 : 9 + (step % 2);
    const frame = roadFrame(id, pose);
    return {
      asset: roadSheet(id),
      rect: [frame.left, frame.top, frame.width, frame.height],
      width: MINI_CELL * 4,
      height: MINI_CELL * 4,
      scale: 1 / MINI_STANDING_HEIGHT,
    };
  }
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
    rect: [frame.left, frame.top, frame.width, frame.height],
    width: 1448,
    height: 1086,
    scale: 1 / 350,
  };
}
export const guildPropsAsset = "/guild/props-v2.webp";
export const guildPropFrames = guildArtFrames["props-v2"];

function lifePose(id: "finn" | "lico", mode: Exclude<GuildPoseKind, "tea">, step: number) {
  if (mode === "walk") return roomPose("walk-v3", id === "finn" ? 0 : 8, 8, step);
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

function roomPose(atlas: "tea-party-v3" | "walk-v3", start: number, count: number, step: number) {
  const frames = guildRoomArt[atlas].frames.slice(start, start + count);
  return {
    ...guildRoomSprite(atlas, start + (step % count)),
    scale: 1 / Math.max(...frames.map((frame) => frame[3])),
  };
}
