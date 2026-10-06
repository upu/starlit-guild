import { ChevronRight } from "lucide-react";
import { guildRecipes } from "@/lib/guild-content";
import { workProgress, workStatus } from "@/lib/guild-ui-status";
import type { State } from "@/lib/game";
import { GuildItemIcon } from "./guild-item-icon";

export function GuildWorkbenchCard({
  state,
  now,
  onOpen,
}: {
  state: State;
  now: number;
  onOpen: () => void;
}) {
  const work = state.guild?.work,
    recipe = guildRecipes.find((r) => r.id === work?.recipe);
  return (
    <button className="guild-facility-card" aria-label="加工の詳細" onClick={onOpen}>
      <span className="guild-facility-copy">
        <b>{recipe?.name ?? "作業台"}</b>
        <small>{workStatus(state, now)}</small>
        {work?.batch && (
          <progress aria-label="加工の進み具合" value={workProgress(state, now)} max={1} />
        )}
      </span>
      {recipe && <GuildItemIcon id={recipe.output} />}
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  );
}
