import type { State } from "./game.ts";
import type { Story } from "./stories.ts";
import { guildStories } from "./guild-stories.ts";
import { guildStoryUnlocked } from "./guild-base.ts";

// Garden duties are away from the home. The workbench is inside the home.
export function guildHomeMembers(state: State) {
  const roles = state.guild?.roles;
  return state.owned.filter((id) => id !== roles?.linde && id !== roles?.brekka);
}
export function guildStoryCast(story: Story) {
  return [...new Set(story.lines.flatMap((line) => (line.speaker ? [line.speaker] : [])))];
}
export function canTellGuildStory(state: State, story: Story) {
  const home = guildHomeMembers(state);
  return (
    guildStoryUnlocked(state, story.id) && guildStoryCast(story).every((id) => home.includes(id))
  );
}
export function nextGuildConversation(state: State) {
  return (
    guildStories.find(
      (story) => !state.story?.read.includes(story.id) && canTellGuildStory(state, story),
    ) ?? null
  );
}
