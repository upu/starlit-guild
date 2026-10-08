import { residentArt, residentIds, type ResidentId } from "./home-actor.ts";

// Copy home pixels intact; wider cells leave room for bows and swords.
export const adventureHeroArt = { cell: 192, foot: 176, height: residentArt.height, frames: 24 };
export const adventureHeroAsset = (id: ResidentId) => `/adventure-pixel/${id}.webp`;
export const adventureHeroIds = residentIds;
export const adventureHeroFrames = {
  idle: 8,
  blink: 9,
  attack: 10,
  gather: 14,
  hurt: 16,
  push: 18,
  pull: 20,
  pack: 22,
} as const;

export function adventureRoadPose(pose: string) {
  if (pose.startsWith("walk-")) return Number(pose.slice(5)) % 8;
  const index = Number(pose);
  if (index < 4) return index * 2;
  if (index < 8) return adventureHeroFrames.attack + index - 4;
  if (index === 8) return adventureHeroFrames.idle;
  if (index === 9 || index === 10) return adventureHeroFrames.gather + index - 9;
  if (index === 12) return adventureHeroFrames.blink;
  if (index >= 14) return adventureHeroFrames.push + index - 14;
  return adventureHeroFrames.hurt + (index === 13 ? 1 : 0);
}
