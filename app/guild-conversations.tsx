import { ChevronRight } from "lucide-react";
import type { State } from "@/lib/game";
import { guildStoryUnlocked } from "@/lib/guild-base";
import { guildStories } from "@/lib/guild-stories";
import type { Story } from "@/lib/stories";
import { GuildFigure, isGuildFigure } from "./guild-figure";

export function GuildConversations({
  state,
  onOpen,
}: {
  state: State;
  onOpen: (story: Story) => void;
}) {
  const available = guildStories.filter((story) => guildStoryUnlocked(state, story.id));
  const read = state.story?.read ?? [];
  return (
    <section className="guild-conversations" aria-label="旅団の日常">
      <p className="guild-caption">倉庫に立ち寄った日のひと幕。好きな話から、何度でも。</p>
      {available.map((story) => {
        const cast = [...new Set(story.lines.map((line) => line.speaker))].filter(
          (id) => !!id && isGuildFigure(id),
        );
        return (
          <button
            className="story-entry guild-story"
            key={story.id}
            onClick={() => {
              onOpen(story);
            }}
          >
            <span className="guild-story-cast" aria-hidden="true">
              {cast.slice(0, 3).map((id, index) => (
                <GuildFigure key={id} id={id} facing={index === 1} />
              ))}
            </span>
            <span>
              <small>{read.includes(story.id) ? "読了" : "未読"}</small>
              <b>{story.title}</b>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        );
      })}
    </section>
  );
}
