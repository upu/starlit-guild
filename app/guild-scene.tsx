import type { State } from "@/lib/game";
import { HomeRoom } from "./home-room";
import { guildHomeMembers } from "@/lib/guild-presence";
import { guildWorkActive } from "@/lib/guild-stage-model";
import { residentIds } from "@/lib/home-actor";
import { roomFurniture } from "@/lib/home-room-layout";
import { GuildWorkbenchCard } from "./guild-facility-card";
export type GuildPlace = "workbench" | "shop" | "roles";
export const guildPlaces = { workbench: "作業台", shop: "ショップ", roles: "担当" };
export function GuildScene({
  state,
  now,
  onWorkbench,
}: {
  state: State;
  now: number;
  onWorkbench: () => void;
}) {
  const members = residentIds.filter((id) => guildHomeMembers(state).includes(id));
  const furniture = roomFurniture("home", state.guild?.home);
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
        markers={furniture
          .filter((item) => item.kind === "bench")
          .map((item) => ({
            id: item.id,
            control: "workbench",
            label: "作業台の仕込み",
            hero: state.guild?.roles.workbench,
          }))}
        onUse={(id) => {
          if (furniture.some((item) => item.id === id && item.kind === "bench")) onWorkbench();
        }}
      />
      <GuildWorkbenchCard state={state} now={now} onOpen={onWorkbench} />
    </div>
  );
}
