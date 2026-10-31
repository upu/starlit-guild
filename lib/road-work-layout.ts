import { roadCartWidth } from "./road-cart-layout.ts";
import { roadDepth, roadX, roadHeroSize } from "./road-layout.ts";
import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";
import type { RoadBattle } from "./road-view.ts";
import type { PartyObstacle, PartyPosition } from "./road-party-spacing.ts";

export function roadWorkWidth(
  width: number,
  cargo: boolean,
  frame?: string,
  height = (width * 2) / 3,
) {
  if (frame === "packing-bench") return roadHeroSize(width, height) * 1.7;
  if (frame === "earthwork") return roadHeroSize(width, height) * 5;
  if (frame === "signpost") return roadHeroSize(width, height) * 0.9;
  if (frame === "waterway-branches") return roadHeroSize(width, height) * 0.32;
  if (["herb", "moss"].includes(frame ?? "")) return roadHeroSize(width, height) * 0.6;
  if (cargo) return roadCartWidth(width);
  return (
    RPG_CAMERA_SCALE *
    Math.min(
      ({ waterway: 85, signpost: 44, ledger: 85 } as Record<string, number>)[frame ?? ""] || 65,
      width * 0.2,
    )
  );
}

function walkableWork(battle: RoadBattle, frame: string | undefined, storybook: boolean) {
  if (battle.journeyCart && battle.gathering?.kind === "cargo") return true;
  return (
    storybook &&
    [
      "earthwork",
      "homeward-route",
      "hand-bottles",
      "passing-cart",
      "night-light",
      "waterway-bank",
      "signpost-restoration",
      "housecalls",
      "berne-medicine",
      "town-parcel",
    ].includes(frame ?? "")
  );
}
/** Reserve the base on the ground, not the tall artwork above it. */
export function roadWorkObstacle(
  battle: RoadBattle,
  width: number,
  height: number,
  foot: PartyPosition,
  frame?: string,
  storybook = false,
): PartyObstacle | undefined {
  const work = battle.gathering;
  if (!work || walkableWork(battle, frame, storybook)) return;
  const kneeling =
    storybook &&
    ((frame === "parcels" && work.task === "pack") ||
      (["herb", "moss", "waterway-branches"].includes(frame ?? "") && work.task === "gather"));
  const cargo = work.kind === "cargo";
  const size = roadWorkWidth(width, cargo, frame, height);
  const depth = roadDepth(width, height);
  return {
    x: (roadX(work.x + 65, battle.distance, width, battle.stage) / width) * 560,
    lane: (work.lane ?? (cargo ? 0.82 : 0.68)) - (size * 0.08) / depth,
    clearance: {
      x: ((size * 0.34) / width) * 560 + foot.x * (kneeling ? 0.15 : 0.4),
      lane: (size * 0.08) / depth + foot.lane * (kneeling ? 0.15 : 0.4),
    },
  };
}
