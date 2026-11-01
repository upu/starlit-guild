import {
  waterwayActionAssets,
  type WaterwayActions,
  type WaterwayPoint,
} from "./road-waterway-contacts.ts";

/** The worker's current position is available to battle pathfinding before the final pose is drawn. */
export function mossRemovalScene(
  holes: number[],
  worker: WaterwayPoint,
  priorityHero?: "aria" | "leon",
): WaterwayActions {
  return {
    poses: {},
    props: [],
    debrisHidden: true,
    closeContact: true,
    priorityHero,
    holes,
    worker: { point: worker, pose: { asset: waterwayActionAssets.worker, frame: 3 } },
  };
}
