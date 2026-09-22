"use client";
import { chapterTwoEnemyAsset } from "@/lib/chapter-two";
import type { KeyboardEvent } from "react";
import { PhaserAdventure } from "./phaser-adventure";
import { BurstScene } from "./battle-effects";
import {
  adventureAction,
  adventureFrame,
  type AdventureIntent,
} from "@/lib/adventure-presentation";
import { type State, type Squad, type Action } from "@/lib/game";
import { chapterRoadActivity, chapterRoadProgress } from "@/lib/chapter-road-presentation";

function activityLabel(frame: ReturnType<typeof adventureFrame>) {
  if (frame.phase === "move") return "次の地点へ移動中";
  if (frame.phase === "rest") return "ひと休み中";
  if (frame.target?.battle)
    return chapterTwoEnemyAsset(frame.quest.id, 0) || [12, 13].includes(frame.quest.enemy)
      ? "いたずらを阻止中"
      : `魔物と戦闘中 · 残り${String(frame.targets.filter((target) => !target.down).length)}体`;
  if (frame.target?.kind === "gather") return "素材を採取中";
  return frame.quest.escortTarget ? "荷物を運搬中" : "旅人を護衛中";
}
function keyboardAction(
  e: KeyboardEvent<HTMLDivElement>,
  perform: (intent: AdventureIntent) => void,
) {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    perform("help");
    return;
  }
  if (e.key.toLowerCase() === "h") {
    e.preventDefault();
    perform("heal");
  }
}
function JourneyOverlay({
  squad,
  now,
  frame,
}: {
  squad: Squad;
  now: number;
  frame: ReturnType<typeof adventureFrame>;
}) {
  const run = squad.run;
  if (!run) return null;
  return (
    <>
      <BurstScene run={run} members={squad.members} now={now} />
      <div className="sr-only">
        <span>
          {frame.members
            .map((m) => `${m.name} HP ${String(Math.ceil(m.hp))}/${String(m.maxHp)}`)
            .join("、")}
          。
        </span>
        <span>
          {frame.targets
            .map((target) =>
              target.battle
                ? `${target.name} ${target.down ? "撃破" : `HP ${String(target.hp)}/${String(target.maxHp)}`}`
                : `${target.name} 作業残り ${String(target.hp)}/${String(target.maxHp)}`,
            )
            .join("、")}
        </span>
      </div>
    </>
  );
}

function mapHeading(
  frame: ReturnType<typeof adventureFrame>,
  run: Squad["run"],
  activity: string,
  clears: number,
) {
  const q = frame.quest;
  return (
    <div className="map-heading">
      <span className="eyebrow">{run ? "EXPLORING" : "A NEW ADVENTURE"}</span>
      <h2>{q.region}</h2>
      <span>
        {run
          ? `${String(run.round)} 周目 · ${activity}`
          : clears === 0
            ? "ふたりの小さな冒険が、ここから始まる。"
            : "支度ができたら、次の冒険へ。"}
      </span>
      {run && (
        <div className="map-journey" aria-hidden="true">
          <span>旅の道のり · {chapterRoadProgress(run)}%</span>
          <progress max={100} value={chapterRoadProgress(run)} />
        </div>
      )}
    </div>
  );
}

export function MapStage({
  state,
  squad,
  now,
  onAction,
  ready,
  startQuest,
  paused = false,
}: {
  state: State;
  squad: Squad;
  now: number;
  onAction: (a: Action) => void;
  ready: boolean;
  startQuest: string;
  paused?: boolean;
}) {
  const input = {
      squad,
      now,
      ready,
      startQuest,
      paused,
      restorationComplete: !!state.done["tower-restoration"],
    },
    frame = adventureFrame(input),
    run = squad.run,
    q = frame.quest;
  function perform(intent: AdventureIntent) {
    const action = adventureAction(input, intent);
    if (action) onAction(action);
  }
  const activity = run?.road ? chapterRoadActivity(input) : activityLabel(frame);
  return (
    <div className="map-shell">
      <div
        className="adventure-map phaser-map"
        data-phase={frame.phase}
        style={{ backgroundImage: `url(${frame.background})` }}
        role={run ? "group" : undefined}
        tabIndex={run && ready && !paused ? 0 : undefined}
        onKeyDown={(e) => {
          keyboardAction(e, perform);
        }}
        aria-label={
          run
            ? `${q.name}の探索マップ。タップで手助け、仲間をタップで回復。キーボードでは Enter で手助け、H で回復。`
            : `${q.region}のキャンプ`
        }
      >
        <PhaserAdventure input={input} onAction={onAction} />
        {mapHeading(frame, run, activity, state.clears)}
        <JourneyOverlay squad={squad} now={now} frame={frame} />
      </div>
    </div>
  );
}
