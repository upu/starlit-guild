/** Ease toward a target without exceeding the ground speed limit. */
export function approach(current: number, target: number, dt: number, speed: number) {
  const step = (target - current) * (1 - Math.exp(-dt / 0.1));
  return current + Math.sign(step) * Math.min(Math.abs(step), speed * dt);
}
