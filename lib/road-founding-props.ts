import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle } from "./road-view.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import type { FoundingJob } from "./road-founding-queue.ts";
import type { WaterwayPoint } from "./road-waterway-contacts.ts";
import { journeyCartWidth } from "./road-journey-cart.ts";
import { foundingCargoSize } from "./road-founding-cargo.ts";
import { roadDepth, roadHeroSize } from "./road-layout.ts";

export function drawFoundingItem(
  scene: NonNullable<RoadBattle["waterwayActions"]>,
  job: FoundingJob,
  cart: JourneyCart,
  view: RoadViewport,
  point: WaterwayPoint,
  actorLane: number,
  grounded = false,
) {
  const size = journeyCartWidth(view, cart);
  const itemWidth = size * foundingCargoSize[job.kind];
  const groundOffset = job.kind === "basket" ? 0.381 : 0.465;
  scene.props.push({
    id: `founding-${job.kind}`,
    asset:
      job.kind === "letter"
        ? "/storybook-study/shipping-record-v1.webp"
        : "/storybook-study/basket-v1.webp",
    point,
    size: itemWidth / roadHeroSize(view.width, view.height),
    depth: grounded
      ? point.lane + (itemWidth * groundOffset) / roadDepth(view.width, view.height)
      : Math.max(actorLane, point.lane, cart.lane) + 0.05,
    ...(grounded ? { groundShadow: groundOffset } : {}),
    origin: { x: 0.5, y: 0.5 },
  });
}
