import type { FoundingJob } from "./road-founding-queue.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadScale } from "./road-layout.ts";

export type FoundingCargo = {
  letter: boolean;
  basket: boolean;
  slots?: { letter: boolean[]; basket: boolean[] };
};
const positions = {
  letter: [
    [-0.3, -0.33],
    [-0.4, -0.33],
    [-0.2, -0.33],
    [-0.35, -0.4],
    [-0.25, -0.4],
  ],
  basket: [
    [-0.16, -0.366],
    [-0.05, -0.366],
    [-0.3, -0.43],
    [-0.18, -0.43],
    [-0.06, -0.43],
  ],
} as const;
export const foundingCargoSize = { letter: 0.12, basket: 0.18 } as const;
export const foundingCargoPosition = (kind: FoundingJob["kind"], index: number) =>
  positions[kind][index] ?? positions[kind][positions[kind].length - 1];
export function foundingCargoPoint(
  job: FoundingJob,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
  size: number,
) {
  const [x, y] = foundingCargoPosition(job.kind, Math.floor(job.node / 3));
  return {
    x: cart.x + (size * x) / roadScale(view.width, stage),
    lane: cart.lane + (size * y) / roadDepth(view.width, view.height),
  };
}

export function foundingCargo(total: number, delivered: Set<number>): FoundingCargo {
  const slots = {
    letter: Array.from({ length: Math.ceil(total / 3) }, (_, index) => !delivered.has(index * 3)),
    basket: Array.from(
      { length: Math.ceil((total - 1) / 3) },
      (_, index) => !delivered.has(index * 3 + 1),
    ),
  };
  return { letter: slots.letter.some(Boolean), basket: slots.basket.some(Boolean), slots };
}
export function removeFoundingCargo(cargo: FoundingCargo, job: FoundingJob) {
  if (cargo.slots) cargo.slots[job.kind][Math.floor(job.node / 3)] = false;
  cargo[job.kind] = false;
}
