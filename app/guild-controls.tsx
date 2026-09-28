import { heroes, type Action, type State } from "@/lib/game";
import { guildRoles, type GuildRole } from "@/lib/guild-content";
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
  return (
    <label className="guild-field">
      {roleNames[role]}
      <select
        aria-label={roleNames[role]}
        value={state.guild?.roles[role] ?? ""}
        disabled={!ready}
        onChange={(event) => {
          onAction({ type: "guildAssign", id: role, hero: event.currentTarget.value || undefined });
        }}
      >
        <option value="">担当なし</option>
        {heroes
          .filter((hero) => state.owned.includes(hero.id))
          .map((hero) => {
            const other = guildRoles.find(
              (id) => id !== role && state.guild?.roles[id] === hero.id,
            );
            return (
              <option key={hero.id} value={hero.id} disabled={!!other}>
                {hero.name}
                {other ? `（${roleNames[other]}）` : ""}
              </option>
            );
          })}
      </select>
    </label>
  );
}
export function timeRemaining(readyAt: number, now: number) {
  const minutes = Math.ceil(Math.max(0, readyAt - now) / 60000);
  return minutes ? `あと${String(minutes)}分` : "収穫待ち";
}
