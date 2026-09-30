import { guildLabArt } from "./guild-lab-art.ts";
import type { LabCharacterArt } from "./guild-lab-characters.ts";

export function labLimbArtwork(frame: number, length: number, art: LabCharacterArt = guildLabArt) {
  const key = String(frame);
  const joints =
    (
      art.armJoints as Partial<
        Record<string, { proximal: readonly number[]; distal: readonly number[] }>
      >
    )[key] ??
    (
      art.legJoints as Partial<
        Record<string, { proximal: readonly number[]; distal: readonly number[] }>
      >
    )[key];
  if (!joints) throw Error(`Missing limb landmarks for frame ${String(frame)}`);
  const [px, py] = joints.proximal;
  const [dx, dy] = joints.distal;
  const [, , width, height] = art.frames[frame];
  const scale = length / Math.hypot(dx - px, dy - py);
  return {
    originX: px / width,
    originY: py / height,
    height: height * scale,
    scale,
    rotation: Math.atan2(dx - px, dy - py),
  };
}
