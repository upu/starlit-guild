"use client";
import { useEffect, useRef, useState } from "react";
import { stories } from "@/lib/stories";
import type { State } from "@/lib/game";
import { StoryReader } from "../../story-scenes";
import { StudyStatus } from "./adventure-status";
import type { LindeProgress } from "../../phaser/renderer-session";
import "./founding-return-review.css";

export function StudyStatusWithReturn({
  quest,
  state,
  painted,
  finished,
  lindeProgress,
}: {
  quest: string;
  state: State | null;
  painted: boolean;
  finished: boolean;
  lindeProgress: LindeProgress | null;
}) {
  const finishingMoss =
    quest === "tower-moss-removal" &&
    painted &&
    !finished &&
    !!state?.done[quest] &&
    !state.squads[0].run;
  return (
    <>
      {finishingMoss ? (
        <output className="storybook-review-status">点検口の後片付けを見守っています</output>
      ) : (
        <StudyStatus {...{ quest, state, painted }} linde={lindeProgress} />
      )}
      {quest === "town-deliveries" && finished && state?.done[quest] && !state.squads[0].run && (
        <output className="storybook-review-status">配達が終わりました</output>
      )}
      <ForestFinishedStatus {...{ quest, state, painted }} />
      <FoundingReturnPreview {...{ quest, state, painted, finished }} />
    </>
  );
}

function ForestFinishedStatus({
  quest,
  state,
  painted,
}: {
  quest: string;
  state: State | null;
  painted: boolean;
}) {
  if (quest !== "forest-wetland" || !painted || !state?.done[quest] || state.squads[0].run)
    return null;
  return (
    <output className="storybook-review-status">採取終了直前の画面を確認用に保持しています</output>
  );
}

/** Preview the actual return conversation without writing the player's save. */
export function FoundingReturnPreview({
  quest,
  state,
  painted,
  finished,
}: {
  quest: string;
  state: State | null;
  painted: boolean;
  finished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const reader = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) reader.current?.scrollIntoView({ block: "end" });
  }, [open]);
  const storyId =
    quest === "forest-wetland" ? "forest-wetland-return" : "starlit-guild-founding-return";
  const story = stories.find((entry) => entry.id === storyId);
  const ready =
    ["starlit-guild-founding", "forest-wetland"].includes(quest) &&
    painted &&
    (quest === "forest-wetland" || finished) &&
    !!state?.done[quest] &&
    !state.squads[0].run;
  if (!ready || !story) return null;
  return (
    <section className="founding-return-review">
      <button
        onClick={() => {
          setOpen(!open);
        }}
      >
        {open ? (quest === "forest-wetland" ? "冒険画面へ戻る" : "帰路へ戻る") : "帰還会話を見る"}
      </button>
      {open && (
        <div className="phone-dialog" ref={reader}>
          <StoryReader
            story={story}
            ready
            onRead={() => true}
            onClose={() => {
              setOpen(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
