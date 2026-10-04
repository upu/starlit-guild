import { useState } from "react";
import { Banter } from "./story-scenes";
import { canTellGuildStory, nextGuildConversation } from "@/lib/guild-presence";
import type { GuildProps } from "./guild-controls";

export function GuildChat({ state, ready, onAction, paused }: GuildProps & { paused: boolean }) {
  const [story, setStory] = useState(() => nextGuildConversation(state));
  const eligible = story && canTellGuildStory(state, story);
  const candidate = nextGuildConversation(state);
  if (story && !eligible) setStory(null);
  else if (!story && candidate) setStory(candidate);
  return (
    <section className="guild-chat" aria-label="旅団のチャット">
      {story && eligible ? (
        <Banter
          key={story.id}
          lines={story.lines}
          paused={paused || !ready}
          label="旅団の日常"
          onComplete={() => {
            onAction({ type: "readStory", id: story.id });
          }}
        />
      ) : (
        <div className="guild-chat-quiet">
          <span aria-hidden="true">✧</span>
          <p>窓から、街の音が聞こえる。</p>
        </div>
      )}
    </section>
  );
}
