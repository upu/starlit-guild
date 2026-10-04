import { guildRecipes } from "@/lib/guild-content";
import { guildRecipeSpot } from "@/lib/guild-menu-model";
import type { GuildProps } from "./guild-controls";
import { PhaserGuild } from "./phaser-guild";
export function GuildRecipeMenu({
  state,
  ready,
  now,
  selected,
  onSelect,
}: GuildProps & { now: number; selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="guild-recipe-scene" role="group" aria-label="作り方">
      <PhaserGuild state={state} now={now} site="workbench" selected={selected} />
      {guildRecipes.map((item, index) => {
        const point = guildRecipeSpot(index);
        return (
          <button
            key={item.id}
            className="guild-scene-choice guild-recipe-choice"
            style={{ left: `${String(point.x * 100)}%` }}
            aria-label={item.name}
            aria-pressed={selected === item.id}
            disabled={!ready || !!state.guild?.work}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            <span>{item.id === "lunch" ? "お弁当" : item.id === "tea" ? "お茶" : "ソーダ"}</span>
          </button>
        );
      })}
    </div>
  );
}
