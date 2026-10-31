import { waterwayLayout } from "./road-waterway-layout.ts";
import { roadDepth } from "./road-layout.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayPoint } from "./road-waterway-contacts.ts";

export function mossBasketSupport(hand: WaterwayPoint, view: RoadViewport) {
  return {
    ...hand,
    lane:
      hand.lane +
      (12 * waterwayLayout(view.width, view.height).figureScale) /
        roadDepth(view.width, view.height),
  };
}

export const mossRemovalAssets = {
  bank: "/storybook-study/drain-inspection-bank-v1.png",
  rim: "/storybook-study/waterway-hatch-rim-v1.webp",
  lid: "/storybook-study/waterway-hatch-lid-v1.webp",
  keeper: "/storybook-study/keeper-hatch-v1.webp",
  keeperWalk: "/storybook-study/keeper-hatch-walk-v1.webp",
  keeperLantern: "/storybook-study/keeper-lantern-v1.webp",
  lantern: "/storybook-study/night-lantern-v1.webp",
  ariaWalk: "/storybook-study/aria-moss-walk-v2.webp",
  cart: "/storybook-study/waterway-moss-cart-v1.webp",
  cycle: "/storybook-study/aria-moss-cycle-v1.webp",
  workerWalk: "/storybook-study/waterway-worker-basket-walk-v1.webp",
  filled: "/storybook-study/waterway-moss-basket-v1.webp",
  aria: "/storybook-study/aria-moss-scrape-v1.webp",
  moss: "/storybook-study/waterway-hatch-moss-v1.webp",
  leon: "/storybook-study/leon-work-v1.webp",
  basket: "/storybook-study/basket-v1.webp",
} as const;

/** Source-art contacts shared by the placement study and the forthcoming work motion. */
export function mossRemovalLayout(width: number, height: number) {
  const layout = waterwayLayout(width, height),
    scale = layout.figureScale;
  const tip = layout.project(1043, 637);
  // Scraping frames 1/2 share the same planted feet; never reanchor each pose to its tool.
  const aria = { x: tip.x - (158 - 96) * scale, y: tip.y - (140 - 176) * scale };
  const basket = layout.project(1040, 685);
  const leon = { x: basket.x + 32 * scale, y: basket.y + 30 * scale };
  return {
    ...layout,
    aria,
    leon,
    basket,
    moss: { ...layout.project(1111, 623), width: (154 * layout.backdrop.width) / 1536 },
    tip: (frame: number) => ({
      x: aria.x + ((frame === 3 ? 155 : frame === 2 ? 167 : 158) - 96) * scale,
      y: aria.y + ((frame === 3 ? 116 : 140) - 176) * scale,
    }),
  };
}
