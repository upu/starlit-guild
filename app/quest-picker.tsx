"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { questScenery } from "@/lib/scenery";
import { storyParty } from "@/lib/story-party";
import { Check, ChevronDown } from "lucide-react";
import { availableQuests, heroes, type State, type Quest } from "@/lib/game";
import { storyStages, nextStage } from "@/lib/prologue";
import { questChapters, questChapter } from "@/lib/quest-navigation";
import { QuestProgressionSetting } from "./quest-progression-setting";

type Props = {
  state: State;
  selected: string;
  onSelect: (id: string) => void;
  onConfirm: (id: string) => void;
  ready: boolean;
  onAutoNextChange: (value: boolean) => void;
};

function chapterOption(item: (typeof questChapters)[number], unlocked: Quest[]) {
  const available = unlocked.some((q) => questChapter(q.id) === item.id);
  if (item.id === "other" && !available) return null;
  return (
    <option key={item.id} value={item.id} disabled={!available}>
      {item.label}
      {!available && "（未解放）"}
    </option>
  );
}

function ChapterSelector({
  chapter,
  unlocked,
  ready,
  onChange,
}: {
  chapter: ReturnType<typeof questChapter>;
  unlocked: Quest[];
  ready: boolean;
  onChange: (id: ReturnType<typeof questChapter>) => void;
}) {
  return (
    <label className="quest-chapters">
      <span>章</span>
      <span className="quest-chapter-field">
        <select
          aria-label="クエストの章"
          value={chapter}
          disabled={!ready}
          onChange={(event) => {
            const item = questChapters.find((item) => item.id === event.currentTarget.value);
            if (item) onChange(item.id);
          }}
        >
          {questChapters.map((item) => chapterOption(item, unlocked))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </span>
    </label>
  );
}

function questOption(
  item: Quest,
  selected: string,
  next: string,
  done: State["done"],
  ready: boolean,
  onSelect: Props["onSelect"],
  onConfirm: Props["onConfirm"],
) {
  return (
    <button
      type="button"
      className="quest-option"
      key={item.id}
      disabled={!ready}
      aria-pressed={selected === item.id}
      onClick={() => {
        if (!ready) return;
        if (selected === item.id) onConfirm(item.id);
        else onSelect(item.id);
      }}
    >
      <Image
        className="quest-option-art"
        src={questScenery(item, "thumbnail")}
        alt=""
        width={320}
        height={320}
        loading="lazy"
        unoptimized
      />
      <span className="quest-option-copy">
        <span className="quest-option-meta">
          <small>
            {storyStages.find((stage) => stage.quest === item.id)?.number || item.region}
          </small>
          {done[item.id] > 0 ? (
            <span
              className="quest-clear-badge"
              role="img"
              aria-label="クリア済み"
              title="クリア済み"
            >
              <Check size={12} aria-hidden="true" />
            </span>
          ) : (
            item.id === next && <small className="quest-progress">次のステージ</small>
          )}
          {item.availability === "once" && <small>一度きり</small>}
        </span>
        <b>{item.name}</b>
      </span>
      {selected === item.id && <Check size={19} />}
    </button>
  );
}

export function QuestPicker({
  state: s,
  selected,
  onSelect,
  onConfirm,
  ready,
  onAutoNextChange,
}: Props) {
  const unlocked = availableQuests(s),
    q = unlocked.find((q) => q.id === selected) || unlocked[0];
  const [chapter, setChapter] = useState(() => questChapter(q.id));
  const next = nextStage(s).quest;
  function changeChapter(id: typeof chapter) {
    const quests = unlocked.filter((item) => questChapter(item.id) === id);
    if (!ready || !quests.length) return;
    const candidate =
      quests.find((item) => item.id === selected) ||
      quests.find((item) => item.id === next) ||
      quests[0];
    setChapter(id);
    onSelect(candidate.id);
  }
  return (
    <div className="quest-picker">
      <ChapterSelector
        chapter={chapter}
        unlocked={unlocked}
        ready={ready}
        onChange={changeChapter}
      />
      <div className="quest-list-scroll">
        <QuestProgressionSetting
          checked={s.autoNextQuest === true}
          onChange={onAutoNextChange}
          disabled={!ready}
        />
        <p className="departure-party">
          <span>
            {storyParty(q.id)
              .map((id) => heroes.find((h) => h.id === id)?.name ?? "不明な仲間")
              .join("・")}
          </span>
        </p>
        <div className="quest-options" aria-label="クエストの一覧">
          {unlocked
            .filter((item) => questChapter(item.id) === chapter)
            .map((item) => questOption(item, q.id, next, s.done, ready, onSelect, onConfirm))}
        </div>
      </div>
      <QuestSummary quest={q} ready={ready} onConfirm={onConfirm} />
    </div>
  );
}

function QuestSummary({
  quest: q,
  ready,
  onConfirm,
}: {
  quest: Quest;
  ready: boolean;
  onConfirm: (id: string) => void;
}) {
  const pointer = useRef({ x: 0, y: 0, moved: false });
  return (
    <button
      type="button"
      className="quest-summary"
      disabled={!ready}
      aria-label={`${q.name}を行先に決定`}
      onPointerDown={(event) => {
        pointer.current = { x: event.clientX, y: event.clientY, moved: false };
      }}
      onPointerMove={(event) => {
        if (Math.hypot(event.clientX - pointer.current.x, event.clientY - pointer.current.y) > 10)
          pointer.current.moved = true;
      }}
      onPointerCancel={() => {
        pointer.current.moved = true;
      }}
      onClick={(event) => {
        if (
          !ready ||
          (event.detail > 0 && pointer.current.moved) ||
          window.getSelection()?.toString()
        )
          return;
        onConfirm(q.id);
      }}
    >
      <span className="quest-summary-label">
        選択中 · {storyStages.find((stage) => stage.quest === q.id)?.number || q.region}
      </span>
      <span className="quest-summary-title">{q.name}</span>
      <span className="quest-description">{q.desc}</span>
    </button>
  );
}
