import { GuildFigure, isGuildFigure } from "./guild-figure";
import { GuildItemIcon } from "./guild-item-icon";
import { guildRecipes } from "@/lib/guild-content";
import type { State } from "@/lib/game";
import { timeRemaining } from "./guild-controls";
import { GuildPropImage } from "./guild-prop-image";
export function GuildCraftStation({
  state,
  now,
  recipeId = "tea",
}: {
  state: State;
  now: number;
  recipeId?: string;
}) {
  const id = state.guild?.roles.workbench,
    work = state.guild?.work;
  const active = !!id && !!work?.batch && work.batch.readyAt > now && work.pausedMs === undefined;
  const recipe =
    guildRecipes.find((item) => item.id === (work?.recipe ?? recipeId)) ?? guildRecipes[1];
  return (
    <div className={`guild-craft-station recipe-${recipe.id}${active ? " is-crafting" : ""}`}>
      {id && isGuildFigure(id) && (
        <span className="guild-counter-worker" data-hero={id}>
          <GuildFigure id={id} crafting={active} />
        </span>
      )}
      <div className="guild-counter-art">
        <GuildPropImage frame={1} />
      </div>
      <CraftTool recipe={recipe.id} />
      {work && (
        <span className="guild-craft-status">
          <GuildItemIcon id={recipe.output} />
          <b>{craftStatus(state, now)}</b>
        </span>
      )}
    </div>
  );
}

export function craftStatus(state: State, now: number) {
  const guild = state.guild;
  if (!guild?.roles.workbench) return "一時停止";
  if (!guild.work?.batch) return "材料・空き待ち";
  return guild.work.batch.readyAt <= now
    ? "在庫の空き待ち"
    : timeRemaining(guild.work.batch.readyAt, now);
}

function CraftTool({ recipe }: { recipe?: string }) {
  return (
    <svg className="guild-craft-tool" viewBox="0 0 80 60" aria-hidden="true">
      {recipe === "lunch" ? (
        <>
          <ellipse cx="40" cy="45" rx="24" ry="9" fill="#efd7a1" />
          <g className="guild-rolling-pin">
            <path d="M10 30h60" stroke="#80542f" strokeWidth="5" />
            <path d="M23 30h34" stroke="#dbb477" strokeWidth="12" />
          </g>
        </>
      ) : recipe === "soda" ? (
        <g className="guild-shaker">
          <path
            d="M31 10h18v12l9 8v25H22V30l9-8Z"
            fill="#83b39e"
            stroke="#d1dbae"
            strokeWidth="2"
          />
          <path d="M30 9h20" stroke="#cdb06c" strokeWidth="5" />
          <circle cx="35" cy="39" r="3" fill="#e8e8b0" />
        </g>
      ) : (
        <>
          <path d="M16 32h47l-7 23H24Z" fill="#9da887" stroke="#ece0b6" strokeWidth="3" />
          <ellipse cx="40" cy="32" rx="24" ry="8" fill="#698369" />
          <path
            className="guild-stirring-spoon"
            d="M41 32 52 7"
            stroke="#d2b778"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            className="guild-pot-steam"
            d="M22 20q-8-7 0-14m11 13q-8-8 0-15"
            fill="none"
            stroke="#eff2d0"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}
