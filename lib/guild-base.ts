import { GUILD_FOUNDING_QUEST } from "./chapter-four.ts";
import type { State } from "./game.ts";

// Provisional chapter-five entry until its story stages land: the founding ending must be read.
export function guildUnlocked(state: State) {
  return state.story?.read.includes(GUILD_FOUNDING_QUEST + "-return") ?? false;
}
export function guildStoryUnlocked(state: State, id: string) {
  return (
    guildUnlocked(state) && (id !== "guild-first-harvest" || (state.guild?.cultivation ?? 0) > 0)
  );
}
