import { GuildFigure, isGuildFigure } from "./guild-figure";
import { GuildItemIcon } from "./guild-item-icon";
import { guildRecipes } from "@/lib/guild-content";
import type { State } from "@/lib/game";
import { timeRemaining } from "./guild-controls";

export function GuildTableArt() {
  return (
    <svg viewBox="0 0 180 120" aria-hidden="true">
      <ellipse cx="90" cy="102" rx="77" ry="14" fill="#19272040" />
      <path d="M35 48v52m110-52v52M64 58v51m55-51v51" stroke="#5b3d2a" strokeWidth="12" />
      <ellipse cx="90" cy="47" rx="78" ry="31" fill="#795335" stroke="#cfac72" strokeWidth="3" />
      <ellipse cx="90" cy="40" rx="78" ry="28" fill="#bb8b50" stroke="#705134" strokeWidth="3" />
      <path d="M24 33h132M28 50h124M74 14v52m32-52v52" stroke="#92673e" strokeWidth="2" />
      <ellipse cx="63" cy="38" rx="13" ry="6" fill="#d6ceb0" />
      <path d="M54 26h16v14q-8 8-16 0Z" fill="#e3d5ad" stroke="#78694b" strokeWidth="2" />
      <path d="M114 25h16v14q-8 8-16 0Z" fill="#93afa1" stroke="#5e7866" strokeWidth="2" />
    </svg>
  );
}
function WorkbenchArt({ front = false }: { front?: boolean }) {
  if (front)
    return (
      <svg viewBox="0 0 180 115" aria-hidden="true">
        <path
          d="M30 64 175 48v19L30 85 10 59V46Z"
          fill="#916237"
          stroke="#5d422b"
          strokeWidth="3"
        />
        <path d="m30 64 145-16M31 72l142-17" stroke="#d0a16a" strokeWidth="2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 180 115" aria-hidden="true">
      <ellipse cx="95" cy="101" rx="79" ry="12" fill="#14271d44" />
      <path d="M28 52v49m132-57v57" stroke="#694a31" strokeWidth="13" />
      <path d="M10 30 153 20 175 48 30 64Z" fill="#cda268" stroke="#755536" strokeWidth="3" />
      <path d="M43 32h47l15 13-48 6Z" fill="#d8bc84" stroke="#937343" strokeWidth="2" />
      <path d="M128 19h19v25h-19Z" fill="#849e86" stroke="#425d4b" strokeWidth="2" />
      <path d="M127 18h21" stroke="#d7bd82" strokeWidth="5" />
    </svg>
  );
}
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
        <WorkbenchArt />
      </div>
      <div className="guild-counter-front">
        <WorkbenchArt front />
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

function craftStatus(state: State, now: number) {
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
