"use client";
import { chapterTwoMischief } from "@/lib/chapter-two";
import type { KeyboardEvent } from "react";
import { useCallback, useState } from "react";
import { RestorationMapRenderer } from "./restoration-map-renderer";
import { BurstScene } from "./battle-effects";
import {
  adventureAction,
  adventureFrame,
  type AdventureIntent,
} from "@/lib/adventure-presentation";
import { type State, type Squad, type Action } from "@/lib/game";
import { chapterRoadActivity, chapterRoadProgress } from "@/lib/chapter-road-presentation";
import type { useRestorationHandoff } from "./use-restoration-handoff";
import { nightBridgeAssets } from "@/lib/road-night-bridge";
import { lindeDeliveryAssets } from "@/lib/road-linde-delivery";
import { lanternRoadAssets } from "@/lib/road-lantern-layout";
import { chapterFourWork, isMossTrailQuest } from "@/lib/chapter-four";
import type { LindeProgress, RendererStatus, TownActivity } from "./phaser/renderer-session";
import type { AdventureInput } from "@/lib/adventure-presentation";
import { currentTownActivity } from "@/lib/road-town-activity";
import { seedlingHandoffNotice } from "./phone-restoration-mode";

function activityLabel(frame: ReturnType<typeof adventureFrame>) {
  if (frame.phase === "move") return "次の地点へ移動中";
  if (frame.phase === "rest") return "ひと休み中";
  if (frame.target?.battle)
    return chapterTwoMischief(frame.quest.id)
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
  townActivity,
}: {
  squad: Squad;
  now: number;
  frame: ReturnType<typeof adventureFrame>;
  townActivity?: string | null;
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
          {townActivity ??
            frame.targets
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
  waiting: string | false = false,
) {
  const q = frame.quest;
  return (
    <div className="map-heading">
      <span className="eyebrow">{run || waiting ? "EXPLORING" : "A NEW ADVENTURE"}</span>
      <h2>{q.region}</h2>
      <span>
        {waiting
          ? waiting
          : run
            ? activity
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

function studyBackground(
  squad: Squad,
  startQuest: string,
  enabled: boolean,
  linde: boolean,
  lantern: boolean,
) {
  if (lantern && (squad.run?.quest ?? startQuest) === "lantern-detour")
    return { backgroundOverride: lanternRoadAssets.bank, storybookHeroes: true };
  if (linde && (squad.run?.quest ?? startQuest) === "linde-requests")
    return { backgroundOverride: lindeDeliveryAssets.bank, storybookHeroes: true };
  return enabled && (squad.run?.quest ?? startQuest) === "keystone-night-road"
    ? { backgroundOverride: nightBridgeAssets.bank, storybookHeroes: true }
    : {};
}

function waitingLabel(
  restoration: ReturnType<typeof useRestorationHandoff> | undefined,
  running: boolean,
) {
  if (restoration) {
    const seedlings = seedlingHandoffNotice(
      restoration.quest,
      restoration.active,
      restoration.waiting,
      running,
    );
    if (seedlings) return seedlings;
  }
  if (!restoration?.waiting) return false;
  return restoration.quest === "keystone-night-road"
    ? "橋に到着するのを見守っています。"
    : "作業を終えるのを見守っています。";
}

function mapLabel(frame: ReturnType<typeof adventureFrame>, run: Squad["run"]) {
  return run
    ? `${frame.quest.name}の探索マップ。タップで手助け、仲間をタップで回復。キーボードでは Enter で手助け、H で回復。`
    : `${frame.quest.region}のキャンプ`;
}

type MapProps = {
  state: State;
  squad: Squad;
  now: number;
  onAction: (a: Action) => void;
  ready: boolean;
  startQuest: string;
  paused?: boolean;
  restoration?: ReturnType<typeof useRestorationHandoff>;
  nightBridgeStudy?: boolean;
  lindeStudy?: boolean;
  lanternStudy?: boolean;
  onRendererStatus?: (status: RendererStatus) => void;
  mossBedsDialogue?: AdventureInput["mossBedsDialogue"];
  recordsDialogue?: AdventureInput["recordsDialogue"];
  merrillSinging?: AdventureInput["merrillSinging"];
  onTownActivity?: (activity: TownActivity) => void;
};
function mapInput(p: MapProps): AdventureInput {
  return {
    squad: p.squad,
    now: p.now,
    ready: p.ready,
    startQuest: p.startQuest,
    paused: !!p.paused,
    mossBedsDialogue: p.mossBedsDialogue,
    recordsDialogue: p.recordsDialogue,
    merrillSinging: p.merrillSinging,
    restorationComplete: !!p.state.done["tower-restoration"],
    questComplete: !!p.state.done[p.squad.run?.quest || p.startQuest],
    ...studyBackground(
      p.squad,
      p.startQuest,
      !!p.nightBridgeStudy,
      !!p.lindeStudy,
      !!p.lanternStudy,
    ),
  };
}
function mapActivity(input: AdventureInput, progress: LindeProgress | null) {
  const run = input.squad.run;
  if (progress && run)
    return chapterFourWork(run.quest, progress.node)?.name ?? chapterRoadActivity(input);
  return run?.road ? chapterRoadActivity(input) : activityLabel(adventureFrame(input));
}
function performMapAction(
  input: AdventureInput,
  onAction: (action: Action) => void,
  intent: AdventureIntent,
) {
  const action = adventureAction(input, intent);
  if (!action) return false;
  onAction(action);
  return true;
}
function showVisualProgress(linde: boolean, lantern: boolean, quest?: string) {
  return linde || lantern || quest === "brekka-arrival" || quest === "starlit-guild-founding";
}
function mossTrailAttribute(run: Squad["run"]) {
  return run && isMossTrailQuest(run.quest) ? "true" : undefined;
}
function townActivityCallback(
  run: Squad["run"],
  restoration: MapProps["restoration"],
  callback?: (activity: TownActivity) => void,
) {
  return (run?.quest ?? restoration?.squad?.run?.quest) === "town-deliveries"
    ? callback
    : undefined;
}
export function MapStage(props: MapProps) {
  const [lindeProgress, setLindeProgress] = useState<LindeProgress | null>(null);
  const [townActivity, setTownActivity] = useState<TownActivity | null>(null);
  const { onTownActivity } = props;
  const reportTownActivity = useCallback(
    (activity: TownActivity) => {
      setTownActivity(activity);
      onTownActivity?.(activity);
    },
    [onTownActivity],
  );
  return (
    <MapStageView
      {...props}
      lindeProgress={lindeProgress}
      setLindeProgress={setLindeProgress}
      townActivity={townActivity}
      setTownActivity={reportTownActivity}
    />
  );
}
export function MapStageView(
  props: MapProps & {
    lindeProgress: LindeProgress | null;
    setLindeProgress: (progress: LindeProgress | null) => void;
    townActivity?: TownActivity | null;
    setTownActivity?: (activity: TownActivity) => void;
  },
) {
  const {
    state,
    squad,
    now,
    onAction,
    ready,
    paused,
    restoration,
    lindeStudy,
    lanternStudy,
    onRendererStatus,
    lindeProgress,
    setLindeProgress,
  } = props;
  const input = mapInput(props),
    frame = adventureFrame(input),
    run = squad.run;
  const visualProgress = showVisualProgress(!!lindeStudy, !!lanternStudy, restoration?.quest);
  const townLabel = currentTownActivity(run, props.townActivity);
  const activity = townLabel ?? mapActivity(input, visualProgress ? lindeProgress : null);
  return (
    <div className="map-shell">
      <div
        className="adventure-map phaser-map"
        data-linde-study={lindeStudy ? "true" : undefined}
        data-moss-trail={mossTrailAttribute(run)}
        data-records-cue={props.recordsDialogue?.cue}
        data-records-patient={props.recordsDialogue?.patient}
        data-merrill-singing={props.merrillSinging ? "true" : undefined}
        data-phase={frame.phase}
        style={{ backgroundImage: `url(${frame.background})` }}
        role={run ? "group" : undefined}
        tabIndex={run && ready && !paused ? 0 : undefined}
        onKeyDown={(e) => {
          keyboardAction(e, (intent) => performMapAction(input, onAction, intent));
        }}
        aria-label={mapLabel(frame, run)}
      >
        <RestorationMapRenderer
          {...{ input, onAction, restoration }}
          onLindeProgress={visualProgress ? setLindeProgress : undefined}
          onTownActivity={townActivityCallback(run, restoration, props.setTownActivity)}
          onStatusChange={onRendererStatus}
        />
        {mapHeading(frame, run, activity, state.clears, waitingLabel(restoration, !!run))}
        <JourneyOverlay squad={squad} now={now} frame={frame} townActivity={townLabel} />
      </div>
    </div>
  );
}
