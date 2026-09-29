import type { State } from "@/lib/game";
import { GuildResidents } from "./guild-residents";
import { GuildStageFloor } from "./guild-stage-floor";
import { GuildCraftStation, GuildTableArt } from "./guild-stage-props";
export type GuildPlace = "workbench" | "shop" | "roles";
export const guildPlaces = { workbench: "作業台", shop: "種・材料", roles: "担当" };
export function GuildScene({
  state,
  now,
  onWorkbench,
}: {
  state: State;
  now: number;
  onWorkbench: () => void;
}) {
  return (
    <div className="guild-scene guild-home-scene">
      <GuildStageFloor />
      <div className="guild-tea-table">
        <GuildTableArt />
      </div>
      <GuildResidents state={state} />
      <button
        className="guild-bench-entry"
        aria-label="作業台の仕込み"
        data-guild-control="workbench"
        onClick={onWorkbench}
      >
        <GuildCraftStation state={state} now={now} />
      </button>
    </div>
  );
}
