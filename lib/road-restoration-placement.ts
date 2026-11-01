/** Source-space positions for the mason and the recovered stone during 3-9. */
export function restorationPlacement(age: number, reduced: boolean, start = { x: 792, y: 570 }) {
  const elapsed = Math.max(0, age);
  const fraction = (start: number, duration: number) =>
    Math.max(0, Math.min(1, (elapsed - start) / duration));
  const approach = fraction(0, 900),
    walk = fraction(2000, 1000),
    retreat = fraction(4700, 700);
  const stoneLift = fraction(1500, 500),
    stoneLower = fraction(3200, 500);
  const mason =
    elapsed < 900
      ? { x: start.x + (870 - start.x) * approach, y: start.y + (650 - start.y) * approach }
      : { x: 870 - 100 * walk + 42 * retreat, y: 650 - 25 * walk - 45 * retreat };
  const stone = { x: 822 - 100 * walk, y: 675 - 60 * stoneLift - 25 * walk + 60 * stoneLower };
  return { mason, stone, pose: placementPose(elapsed, reduced) };
}

/** Crossfade through a physically thick side view while turning the stone. */
export function restorationStoneTurn(age: number) {
  const progress = Math.max(0, Math.min(1, (age - 3000) / 600));
  const faceAlpha = Math.abs(1 - 2 * progress);
  return { upperFace: progress >= 0.5, faceAlpha, sideAlpha: 1 - faceAlpha };
}
function placementPose(elapsed: number, reduced: boolean) {
  if (elapsed < 900)
    return {
      type: "walk" as const,
      frame: reduced ? 0 : 1 + (Math.floor(elapsed / 170) % 4),
      facing: -1 as const,
    };
  if (elapsed < 1500) return { type: "replace" as const, frame: 1, facing: 1 as const };
  if (elapsed < 2000) return liftPose(elapsed - 1500, reduced, false);
  if (elapsed < 3200) return carryPose(elapsed, reduced);
  return finishPose(elapsed, reduced);
}

function carryPose(elapsed: number, reduced: boolean) {
  // Put the raised foot down before bending to set the stone in place.
  const frame = reduced || elapsed >= 3000 ? 2 : Math.floor((elapsed - 2000) / 250);
  return { type: "carry" as const, frame, facing: 1 as const };
}

function finishPose(elapsed: number, reduced: boolean) {
  if (elapsed < 3700) return liftPose(elapsed - 3200, reduced, true);
  if (elapsed < 4100) return { type: "replace" as const, frame: 3, facing: 1 as const };
  if (elapsed < 4700) return liftPose(elapsed - 4100, reduced, false);
  if (elapsed < 5400)
    return {
      type: "walk" as const,
      frame: reduced ? 0 : 1 + (Math.floor((elapsed - 4700) / 175) % 4),
      facing: -1 as const,
    };
  return { type: "walk" as const, frame: 0, facing: -1 as const };
}

function liftPose(age: number, reduced: boolean, lowering: boolean) {
  const step = reduced ? 3 : Math.min(3, Math.floor(age / 125));
  return { type: "lift" as const, frame: lowering ? 3 - step : step, facing: 1 as const };
}
