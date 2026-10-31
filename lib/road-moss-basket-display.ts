import type { RoadBattle } from "./road-view.ts";
import { mossRemovalAssets as assets } from "./road-moss-removal-layout.ts";
import type { WaterwayActions, WaterwayPoint } from "./road-waterway-contacts.ts";
import type { RoadMossBasketPause } from "./road-moss-basket-pause.ts";

export function mossBasketDepth(
  phase: string,
  worker: WaterwayPoint,
  leon: WaterwayPoint,
  point: WaterwayPoint,
  fighting: boolean,
) {
  if (["shuttle", "receive"].includes(phase)) return worker.lane + 0.002;
  return fighting ? point.lane : leon.lane + 0.002;
}

export function holdMossSpatula(battle: RoadBattle, scene: WaterwayActions, stride: number) {
  const aria = battle.heroes.find((hero) => hero.id === "aria");
  if (aria && !battle.enemies.some((enemy) => enemy.hp > 0))
    scene.poses.aria = aria.walking
      ? { asset: assets.ariaWalk, frame: stride, cell: 256 }
      : { asset: assets.cycle, frame: 0, cell: 256, rows: 2 };
}

export function recordMossBasket(
  pause: RoadMossBasketPause,
  phase: string,
  point: WaterwayPoint,
  leon: RoadBattle["heroes"][number],
  scene: WaterwayActions,
) {
  if (["lift", "carry", "give", "return", "settle"].includes(phase) && scene.poses.leon)
    pause.record(point, leon);
  else pause.clearHeld();
}
