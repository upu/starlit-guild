import { roadHeroSize, roadY } from "./road-layout.ts";
import { enemyDisplayHeight } from "./road-enemy-layout.ts";
import type { RoadBattle, RoadEffect, TravellerId } from "./road-view.ts";

export const STORYBOOK_EFFECTS = "/storybook-study/road-effects-v1.webp";
export const paintedEffectFrames: Partial<Record<RoadEffect["kind"], number>> = {
  arrow: 0,
  slash: 1,
  magic: 2,
  heal: 2,
  gather: 3,
  assist: 1,
};
// Contact points in the delivered strike frame, relative to the common sole (96,176).
export const paintedEmitters: Record<TravellerId, { x: number; y: number }> = {
  aria: { x: 45, y: -86 },
  leon: { x: 70, y: -95 },
  mira: { x: 47, y: -119 },
  finn: { x: 49, y: -89 },
  lico: { x: 28, y: -82 },
};
const sizes = { arrow: 0.55, slash: 0.6, magic: 0.55, heal: 0.7, gather: 0.5, assist: 0.4 };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function impact(state: RoadBattle, effect: RoadEffect, width: number, height: number) {
  const enemy = state.enemies.find(
    (e) => Math.abs(e.x - effect.x) < 0.01 && Math.abs(e.lane - effect.lane) < 0.01,
  );
  const targetHeight = enemy
    ? enemyDisplayHeight(enemy, width, height)
    : roadHeroSize(width, height) * 0.9;
  return { x: effect.x, y: roadY(effect.lane, height, width) - targetHeight * 0.48 };
}

/** Rendering-only timing and geometry. Combat events, damage and saves stay intact. */
export function paintedEffectLayout(
  state: RoadBattle,
  effect: RoadEffect,
  width: number,
  height: number,
  screenX: (x: number) => number,
) {
  const frame = paintedEffectFrames[effect.kind];
  if (frame === undefined) return;
  const heroSize = roadHeroSize(width, height);
  const { x: startX, y: startY, lane: fromLane } = emission(state, effect, width, height, screenX);
  const target = impact(state, effect, width, height),
    endX = screenX(target.x);
  const age = state.time - effect.at;
  const delay = effect.kind === "gather" ? 0 : 150;
  const released = age - delay;
  const projectile = effect.kind === "arrow" || effect.kind === "magic";
  const p = projectile ? Math.max(0, Math.min(1, released / 200)) : 1;
  return {
    frame,
    x: lerp(startX, endX, p),
    y: lerp(startY, target.y, p),
    size: heroSize * sizes[effect.kind as keyof typeof sizes] * (effect.wide ? 1.2 : 1),
    alpha: Math.max(0, Math.min(1, released / 45)) * Math.max(0, Math.min(1, (550 - age) / 200)),
    rotation: effect.kind === "arrow" ? Math.atan2(target.y - startY, endX - startX) : 0,
    flipX: effect.kind === "slash" && endX < startX,
    depth: 10 + lerp(fromLane, effect.lane, p) * 10 + 0.2,
    tint: effectTint(effect),
  };
}

function emission(
  state: RoadBattle,
  effect: RoadEffect,
  width: number,
  height: number,
  screenX: (x: number) => number,
) {
  const unit = (roadHeroSize(width, height) * 0.9) / 144;
  const source = state.heroes.find((h) => h.id === effect.hero);
  const contact = source ? paintedEmitters[source.id] : { x: 0, y: -80 };
  const lane = source?.lane ?? effect.fromLane ?? effect.lane;
  return {
    x: screenX(source?.x ?? effect.fromX ?? effect.x) + contact.x * unit * (source?.facing ?? 1),
    y: roadY(lane, height, width) + contact.y * unit,
    lane,
  };
}

function effectTint(effect: RoadEffect) {
  if (effect.kind === "heal") return 0xc9ebbd;
  return effect.hero === "lico" && effect.kind === "magic" ? 0xe6f38b : 0xffffff;
}
