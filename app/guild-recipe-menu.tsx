import { guildRecipes } from "@/lib/guild-content";
import type { GuildProps } from "./guild-controls";
import { GuildItemIcon } from "./guild-item-icon";
export function GuildRecipeMenu({
  state,
  ready,
  selected,
  onSelect,
}: GuildProps & { now: number; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="guild-recipes" role="group" aria-label="作り方">
      {guildRecipes.map((item) => (
        <button
          key={item.id}
          className="guild-recipe-choice"
          aria-label={item.name}
          aria-pressed={selected === item.id}
          disabled={!ready || !!state.guild?.work}
          onClick={() => {
            onSelect(item.id);
          }}
        >
          <GuildItemIcon id={item.output} />
          <span>{item.id === "lunch" ? "お弁当" : item.id === "tea" ? "お茶" : "ソーダ"}</span>
        </button>
      ))}
    </div>
  );
}
