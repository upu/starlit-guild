import type { State, Action } from "@/lib/game";
import { HomeRoom } from "./home-room";
import { guildHomeMembers } from "@/lib/guild-presence";
import { guildWorkActive } from "@/lib/guild-stage-model";
import { residentIds } from "@/lib/home-actor";
import { roomFurniture } from "@/lib/home-room-layout";
import { craftStatus } from "./guild-controls";
export type GuildPlace = "workbench" | "shop" | "roles";
export const guildPlaces = { workbench: "作業台", shop: "種・材料", roles: "担当" };
export function GuildScene({
  state,
  now,
  onWorkbench,
  onAction,
  ready,
}: {
  state: State;
  now: number;
  onWorkbench: () => void;
  onAction: (action: Action) => boolean;
  ready: boolean;
}) {
  const members = residentIds.filter((id) => guildHomeMembers(state).includes(id));
  const working = guildWorkActive(state, now)
    ? residentIds.find((id) => id === state.guild?.roles.workbench)
    : undefined;
  return (
    <div className="guild-pixel-home">
      <HomeRoom
        site="home"
        members={members}
        layout={state.guild?.home}
        working={working}
        onLayout={ready ? (furniture) => onAction({ type: "guildArrange", furniture }) : undefined}
        onUse={(id) => {
          if (
            roomFurniture("home", state.guild?.home).some(
              (item) => item.id === id && item.kind === "bench",
            )
          )
            onWorkbench();
        }}
      />
      <button
        className="guild-pixel-facility"
        data-guild-control="workbench"
        aria-label="作業台の仕込み"
        onClick={onWorkbench}
      >
        作業台の仕込み{state.guild?.work ? ` · ${craftStatus(state, now)}` : ""}
      </button>
    </div>
  );
}
