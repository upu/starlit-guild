import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { GuildGarden } from "./guild-garden";
import { GuildWorkbench } from "./guild-workbench";
import { GuildShop } from "./guild-shop";
import type { GuildProps } from "./guild-controls";
import { guildLevel } from "@/lib/guild-content";
import type { State } from "@/lib/game";
import { guildUnlocked, guildStoryUnlocked } from "@/lib/guild-base";
import { guildStories } from "@/lib/guild-stories";
import type { Story } from "@/lib/stories";

export function GuildPanel({
  state,
  onOpen,
  ready,
  onAction,
  now,
}: {
  onOpen: (story: Story) => void;
  now: number;
} & GuildProps) {
  const [page, setPage] = useState("garden");
  if (!guildUnlocked(state)) return null;
  const props = { state, ready, onAction, now };
  return (
    <div className="guild-panel">
      <header className="guild-heading">
        <p>リンデ · 倉庫の二階</p>
        <h2>星灯りの旅団</h2>
        <p>
          F級 · 栽培 Lv.{guildLevel(state.guild?.cultivation ?? 0)} · 加工 Lv.
          {guildLevel(state.guild?.crafting ?? 0)}（上限3）
        </p>
        <p>手紙を読んで、仕事の支度をして。またここで会うための場所。</p>
      </header>
      <nav className="guild-pages" aria-label="旅団の施設">
        {[
          ["garden", "菜園"],
          ["workbench", "作業台"],
          ["shop", "種・材料"],
          ["stories", "日常"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={page === id}
            onClick={() => {
              setPage(id);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <p className="guild-caption">
        担当中も冒険に参加できます。同じ人は二つの仕事を兼ねられません。
      </p>
      {page === "garden" && <GuildGarden {...props} />}
      {page === "workbench" && <GuildWorkbench {...props} />}
      {page === "shop" && <GuildShop {...props} />}
      {page === "stories" && <GuildConversations state={state} onOpen={onOpen} />}
    </div>
  );
}
function GuildConversations({ state, onOpen }: { state: State; onOpen: (story: Story) => void }) {
  const available = guildStories.filter((story) => guildStoryUnlocked(state, story.id));
  const read = state.story?.read ?? [],
    unread = available.filter((story) => !read.includes(story.id)).length;
  return (
    <section aria-labelledby="guild-conversations-title">
      <div className="guild-section-heading">
        <h3 id="guild-conversations-title">旅団の日常</h3>
        <span>{unread ? `未読 ${String(unread)}` : "すべて読了"}</span>
      </div>
      <p className="guild-caption">倉庫に立ち寄った日のひと幕。好きな話から、何度でも。</p>
      {available.map((story) => (
        <button
          className="story-entry"
          key={story.id}
          onClick={() => {
            onOpen(story);
          }}
        >
          <span>
            <small>{read.includes(story.id) ? "読了" : "未読"}</small>
            <b>{story.title}</b>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}
