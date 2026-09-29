import type { State } from "@/lib/game";
import { PhaserGuild } from "./phaser-guild";
import { GuildDutyFace } from "./guild-duty-marker";
import { craftStatus } from "./guild-controls";
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
  const work = state.guild?.work;
  return (
    <div className="guild-scene guild-home-scene">
      <PhaserGuild state={state} now={now} site="home" />
      <button
        className="guild-bench-entry"
        aria-label="作業台の仕込み"
        data-guild-control="workbench"
        onClick={onWorkbench}
      >
        <GuildDutyFace id={state.guild?.roles.workbench} />
        {work && <span className="guild-bench-time">{craftStatus(state, now)}</span>}
      </button>
    </div>
  );
}
