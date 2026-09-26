"use client";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import type { State } from "@/lib/game";
import { questChapter, questChapters, type QuestChapter } from "@/lib/quest-navigation";
import { availableStories, storyProgress, type Story } from "@/lib/stories";
import { memoryGroups } from "./story-memory-groups";

function memoryFilters(
  onlyUnread: boolean,
  setOnlyUnread: (value: boolean) => void,
  unread: number,
) {
  return (
    <div className="memory-filters" aria-label="物語の表示">
      <button
        aria-pressed={!onlyUnread}
        onClick={() => {
          setOnlyUnread(false);
        }}
      >
        すべて
      </button>
      <button
        aria-pressed={onlyUnread}
        onClick={() => {
          setOnlyUnread(true);
        }}
      >
        未読 {unread}
      </button>
    </div>
  );
}

function memoryEntries(items: Story[], read: string[], onOpen: (story: Story) => void) {
  return memoryGroups(items).map((group) => (
    <section key={group.id}>
      <h3>{group.title}</h3>
      {group.items.map((story) => (
        <button
          key={story.id}
          className="story-entry"
          onClick={() => {
            onOpen(story);
          }}
        >
          <span>
            <small>
              {story.chapter === "interlude"
                ? "幕間"
                : story.chapter === "departure"
                  ? "出発前"
                  : "達成後"}
              {!read.includes(story.id) && " · 未読"}
            </small>
            <b>{story.title}</b>
          </span>
          <ChevronRight size={18} />
        </button>
      ))}
    </section>
  ));
}

function memoryChapterSelector(
  chapters: (typeof questChapters)[number][],
  selected: QuestChapter,
  onChange: (chapter: QuestChapter) => void,
) {
  return (
    <span className="quest-chapter-field">
      <select
        aria-label="思い出の章"
        value={selected}
        onChange={(event) => {
          const next = chapters.find((item) => item.id === event.currentTarget.value);
          if (next) onChange(next.id);
          event.currentTarget.closest(".phone-dialog")?.scrollTo({ top: 0 });
        }}
      >
        {chapters.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </span>
  );
}

export function StoryLibrary({ state, onOpen }: { state: State; onOpen: (story: Story) => void }) {
  const available = availableStories(state),
    read = storyProgress(state).read;
  const chapters = questChapters.filter((chapter) =>
    available.some((story) => questChapter(story.quest ?? story.id) === chapter.id),
  );
  const [selected, setSelected] = useState<QuestChapter | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const chapter = chapters.find((item) => item.id === selected) ?? chapters.at(-1);
  const entries = available.filter(
    (story) => questChapter(story.quest ?? story.id) === chapter?.id,
  );
  const unread = entries.filter((story) => !read.includes(story.id));
  const items = onlyUnread ? unread : entries;
  return (
    <div className="story-library">
      {chapter && (
        <div className="memory-toolbar">
          {memoryChapterSelector(chapters, chapter.id, setSelected)}
          {memoryFilters(onlyUnread, setOnlyUnread, unread.length)}
        </div>
      )}
      {available.length === 0 ? (
        <div className="story-empty">
          <BookOpen />
          <p>最初の思い出は、ふたりで「街への交易」へ出発すると開きます。</p>
        </div>
      ) : (
        items.length === 0 && <p>この章の思い出はすべて読み終えました。</p>
      )}
      {memoryEntries(items, read, onOpen)}
    </div>
  );
}
