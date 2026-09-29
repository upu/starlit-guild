import { UserRound, X } from "lucide-react";
import { heroes, type Action, type State } from "@/lib/game";
import { guildRoles, type GuildRole } from "@/lib/guild-content";
import { Portrait } from "./portrait";
export type GuildProps = { state: State; ready: boolean; onAction: (action: Action) => boolean };
export const roleNames = {
  linde: "リンデの世話係",
  brekka: "ブレッカの世話係",
  workbench: "加工担当",
};
export function GuildRolePicker({
  state,
  ready,
  onAction,
  role,
}: GuildProps & { role: GuildRole }) {
  const current = state.guild?.roles[role];
  return (
    <div className="guild-role-picker" role="group" aria-label={roleNames[role]}>
      <UserRound size={18} aria-hidden="true" />
      {heroes
        .filter((hero) => state.owned.includes(hero.id))
        .map((hero) => {
          const other = guildRoles.find((id) => id !== role && state.guild?.roles[id] === hero.id);
          return (
            <button
              key={hero.id}
              aria-label={`${roleNames[role]}：${hero.name}${other ? `（${roleNames[other]}）` : ""}`}
              title={other ? roleNames[other] : hero.name}
              disabled={!ready || !!other}
              aria-pressed={current === hero.id}
              onClick={() => {
                onAction({ type: "guildAssign", id: role, hero: hero.id });
              }}
            >
              <Portrait index={hero.sprite} size={40} />
              <span>{hero.name}</span>
            </button>
          );
        })}
      <button
        aria-label={`${roleNames[role]}を外す`}
        disabled={!ready || !current}
        onClick={() => {
          onAction({ type: "guildAssign", id: role });
        }}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
export function timeRemaining(readyAt: number, now: number) {
  const minutes = Math.ceil(Math.max(0, readyAt - now) / 60000);
  return minutes ? `あと${String(minutes)}分` : "収穫待ち";
}

export function craftStatus(state: State, now: number) {
  const guild = state.guild;
  if (!guild?.roles.workbench) return "一時停止";
  if (!guild.work?.batch) return "材料・空き待ち";
  return guild.work.batch.readyAt <= now
    ? "在庫の空き待ち"
    : timeRemaining(guild.work.batch.readyAt, now);
}
