"use client";
import { useRef, useState } from "react";
import { trioQuest } from "@/lib/chapter-two";
import Image from "next/image";
import { Check, LockKeyhole } from "lucide-react";
import { availableQuests, heroes, type State, type Quest } from "@/lib/game";
import { storyStages, nextStage } from "@/lib/prologue";
import { questChapters, questChapter } from "@/lib/quest-navigation";
import { originalCharacters } from "@/lib/original-characters";
import { Sprite } from "./sprite";
import { questScenery } from "@/lib/scenery";
import { QuestProgressionSetting } from "./quest-progression-setting";

type Props = {
  state: State;
  selected: string;
  onSelect: (id: string) => void;
  onConfirm: (id: string) => void;
  ready: boolean;
  onAutoNextChange: (value: boolean) => void;
};
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
    const candidate =
      quests.find((item) => item.id === selected) ||
      quests.find((item) => item.id === next) ||
      quests[0];
    if (!ready) return;
    setChapter(id);
    onSelect(candidate.id);
  }
  return (
    <div className="quest-picker">
      <div className="quest-chapters" role="group" aria-label="クエストの章">
        {questChapters.map((item) => {
          const available = unlocked.some((q) => questChapter(q.id) === item.id);
          if (item.id === "other" && !available) return null;
          return (
            <button
              type="button"
              key={item.id}
              disabled={!ready || !available}
              aria-pressed={chapter === item.id}
              onClick={() => {
                changeChapter(item.id);
              }}
            >
              {!available && <LockKeyhole size={14} />} {item.label}
              {!available && <span className="sr-only">（未解放）</span>}
            </button>
          );
        })}
      </div>
      <QuestProgressionSetting
        checked={s.autoNextQuest === true}
        onChange={onAutoNextChange}
        disabled={!ready}
      />
      <p className="departure-party">
        <span>
          {(trioQuest(q.id) ? ["aria", "leon", "mira"] : ["aria", "leon"])
            .map((id) => heroes.find((h) => h.id === id)?.name ?? "不明な仲間")
            .join("・")}
        </span>
      </p>
      <div className="quest-options" aria-label="クエストの一覧">
        {unlocked
          .filter((item) => questChapter(item.id) === chapter)
          .map((item) => (
            <button
              type="button"
              className="quest-option"
              key={item.id}
              disabled={!ready}
              aria-pressed={q.id === item.id}
              onClick={() => {
                if (!ready) return;
                if (q.id === item.id) onConfirm(item.id);
                else onSelect(item.id);
              }}
            >
              <Image
                src={questScenery(item, "thumbnail")}
                alt=""
                width={320}
                height={320}
                loading="lazy"
                unoptimized
              />
              <span>
                <small>
                  {storyStages.find((stage) => stage.quest === item.id)?.number || item.region}
                  {item.availability === "once" ? " · 一度きり" : ""}
                </small>
                <b>{item.name}</b>
                {s.done[item.id] > 0 ? (
                  <small className="quest-progress">クリア済み</small>
                ) : (
                  item.id === next && <small className="quest-progress">次のステージ</small>
                )}
              </span>
              {q.id === item.id && <Check size={19} />}
            </button>
          ))}
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
  const opponent = originalCharacters.find((c) => c.sprite === q.enemy);
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
      <span className="quest-landscape">
        <Image
          key={q.id}
          src={questScenery(q, "detail")}
          alt={q.region}
          width={800}
          height={450}
          loading="eager"
          unoptimized
        />
        <span>{q.region}</span>
      </span>
      <span className="quest-summary-title">{q.name}</span>
      {opponent && (
        <span className="quest-opponent">
          <Sprite index={opponent.sprite} size={112} />
          <span>
            <small>{opponent.faction}</small>
            <b>{opponent.name}</b>
            <span>{opponent.bio}</span>
          </span>
        </span>
      )}
      <span className="quest-description">{q.desc}</span>
    </button>
  );
}
