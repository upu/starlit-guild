import type { RoadLook } from "@/lib/chapter-road-presentation";
import { seedlingCartWidth, type RoadViewport } from "@/lib/road-cart-layout";
import { roadWorkWidth } from "@/lib/road-work-layout";
import { journeyCartWidth, type JourneyCart } from "@/lib/road-journey-cart";
import { isSeedlingCart, storybookWorkAppearance } from "@/lib/road-storybook-work";
import { ROAD_CARGO, ROAD_HERB } from "./road-art";

export function roadWorkAppearance(
  look: RoadLook,
  view: RoadViewport,
  cargo: boolean,
  journey = false,
  cart?: Pick<JourneyCart, "asset">,
) {
  const size = journey
    ? journeyCartWidth(view, cart)
    : cargo && look.storybookHeroes && isSeedlingCart(look)
      ? seedlingCartWidth(view)
      : roadWorkWidth(view.width, cargo, look.work?.frame, view.height);
  const asset = look.work?.asset || (cargo ? ROAD_CARGO : ROAD_HERB),
    frame = look.work?.frame || (cargo ? "cart" : "__BASE");
  return { size, asset, frame, ...storybookWorkAppearance(look) };
}
