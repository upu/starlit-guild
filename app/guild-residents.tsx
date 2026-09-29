import { heroes, type State } from "@/lib/game";
import type { GuildPlotId } from "@/lib/guild-content";
import { GuildFigure, isGuildFigure } from "./guild-figure";

function Resident({
  id,
  job,
  active = false,
  facing = false,
}: {
  id?: string;
  job: string;
  active?: boolean;
  facing?: boolean;
}) {
  if (!id || !isGuildFigure(id)) return null;
  const name = heroes.find((hero) => hero.id === id)?.name ?? id;
  return (
    <span
      className={`guild-resident resident-${job}${job.startsWith("visitor") || (["garden", "moss"].includes(job) && active) ? " can-stroll" : ""}`}
      role="img"
      aria-label={`${name}：${job === "garden" ? "菜園の世話係" : job === "workbench" ? "加工担当" : job === "moss" ? "ブレッカの栽培記録" : "ひと休み"}`}
    >
      <span className="guild-standing">
        <GuildFigure id={id} working={active} facing={facing} />
      </span>
      <span className="guild-strolling">
        <GuildFigure id={id} walking />
      </span>
      {active && <i className="guild-work-spark" />}
    </span>
  );
}
export function GuildResidents({
  state,
  site = "home",
}: {
  state: State;
  site?: "home" | "linde" | "brekka";
}) {
  const roles = state.guild?.roles ?? {};
  const visitors = state.owned.filter(
    (id) => isGuildFigure(id) && !Object.values(roles).includes(id),
  );
  const tending = ["linde-1", "linde-2"].some(
    (id) => !!state.guild?.plots[id as GuildPlotId].batch,
  );
  if (site !== "home")
    return (
      <div className="guild-residents">
        <Resident
          id={roles[site]}
          job={site === "linde" ? "garden" : "moss"}
          active={site === "linde" ? tending : !!state.guild?.plots["brekka-1"].batch}
        />
      </div>
    );
  return (
    <div className="guild-residents">
      {visitors.map((id, index) => (
        <Resident key={id} id={id} job={`visitor-${String(index)}`} facing={index === 1} />
      ))}
      {visitors.length >= 2 && (
        <span className="guild-chatter" aria-hidden="true">
          <i>…</i>
          <i>…!</i>
        </span>
      )}
    </div>
  );
}
