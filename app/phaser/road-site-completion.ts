import type { RoadLook } from "@/lib/road-look";
import type { RoadBattle } from "@/lib/road-view";

/** Notify once per run after the selected site's drawing has actually finished. */
export class RoadSiteCompletion {
  private foundation = "";
  private town = "";
  private forest = "";
  private waterwaySearch = "";

  update(look: RoadLook, battle: RoadBattle, key: string, notify?: (quest: string) => void) {
    this.early(look, battle, key, notify);
    if (look.foundation?.visualComplete && this.foundation !== key) {
      this.foundation = key;
      notify?.("missing-keystone");
    }
    if (look.townFinalizing && battle.townVisualComplete && this.town !== key) {
      this.town = key;
      notify?.("town-deliveries");
    }
  }

  private early(look: RoadLook, battle: RoadBattle, key: string, notify?: (quest: string) => void) {
    if (
      look.waterwaySearchFinalizing &&
      battle.waterwaySearchVisualComplete &&
      this.waterwaySearch !== key
    ) {
      this.waterwaySearch = key;
      notify?.("old-waterway");
    }
    if (look.forestFinalizing && battle.forestVisualComplete && this.forest !== key) {
      this.forest = key;
      notify?.("forest-wetland");
    }
  }
}
