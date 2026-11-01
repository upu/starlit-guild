import type { RoadLook } from "@/lib/road-look";
import type { RoadBattle } from "@/lib/road-view";
import { townVisualActivity } from "@/lib/road-town-activity";
import type { TownActivity } from "./renderer-session";

/** Report changes, including the end of an overridden activity, once per run. */
export class TownActivityPublisher {
  private key = "";

  publish(
    look: RoadLook,
    battle: RoadBattle,
    key: string,
    started: number | undefined,
    send?: (activity: TownActivity) => void,
  ) {
    if (look.quest !== "town-deliveries" || started === undefined) {
      this.key = "";
      return;
    }
    const label = townVisualActivity(look, battle);
    const activityKey = `${key}:${label ?? ""}`;
    if (activityKey === this.key) return;
    this.key = activityKey;
    send?.({ started, label });
  }
}
