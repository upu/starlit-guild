"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type State, type Action } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import { StudyRoad } from "./adventure-road";
import { chapterRoadFrame } from "@/lib/chapter-road-presentation";
import { studyDescription, hasVisualProgress } from "./adventure-description";
import { StudyPlaybackControls } from "./adventure-choice";
import { PuppetReviewButton } from "./adventure-puppet-review";
import { SignpostReviewButton } from "./adventure-signpost-review";
import { NightPushReviewButton } from "./adventure-night-review";
import { CrewReviewButtons } from "./adventure-crew-review";
import { BrekkaChapterReviewButtons } from "./adventure-brekka-review";
import {
  arrivalReady,
  puppetEscapeReady,
  reviewPointReady,
  type ReviewMode,
} from "./adventure-review-points";
import { RoadMotion } from "@/lib/road-motion";
import { pendingInterlude } from "@/lib/interludes";
import { syncEnemyTotals } from "@/lib/combat";
import type { RendererStatus } from "../../phaser/renderer-session";
import type { LindeProgress } from "../../phaser/renderer-session";
import { StudyBanter, useRestorationDialogue } from "./restoration-banter";
import {
  visibleStudyState,
  updateStudySnapshot,
  forestPreviewFrozen,
  type StudySnapshot,
} from "./restoration-preview-state";
import { StudyAssistControl } from "./restoration-assist";
import { StudyStatusWithReturn } from "./founding-return-review";
import { adventureRestart, RestartButtons } from "./adventure-restart";
import { mossAmbushReview } from "./moss-ambush-review";
function startStudy(quest = storyStages[2].quest, fullParty = false) {
  const index = storyStages.findIndex((stage) => stage.quest === quest);
  let state = testState(
    Date.now(),
    fullParty ? storyStages.length : Math.max(0, index),
    fullParty
      ? 18
      : ({
          "forest-wetland": 3,
          "tower-restoration": 18,
          "moonlit-herbs": 8,
          "hilltop-picnic": 8,
          "sweet-blockade": 18,
          "spinning-signpost": 18,
          "begging-golem": 18,
          "medicine-road-home": 18,
          "berne-road": 24,
          "tower-road": 8,
          "moss-night-road": 8,
          "village-trade": 8,
          "evening-trade-road": 8,
        }[quest] ?? 40),
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  return act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
}

function packingVisible(state: State, width: number) {
  const height = (width * 2) / 3;
  const frame = chapterRoadFrame(
    {
      squad: state.squads[0],
      startQuest: storyStages[2].quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
    },
    false,
    1400,
    { width, height },
  );
  const workers = new RoadMotion().update(frame, "study", width, false, height).look.workers;
  return (
    frame.battle.gathering?.task === "pack" && ["aria", "leon"].every((id) => workers.includes(id))
  );
}

function packingStudy() {
  let state = startStudy();
  for (let step = 0; step < 3000; step++) {
    if (packingVisible(state, 936) && packingVisible(state, 374)) return state;
    state = settle(state, state.updatedAt + 100);
  }
  throw Error("Packing review point was not reached");
}

function reviewStudy(quest: string, fullParty: boolean, mode: ReviewMode) {
  let state = startStudy(quest, fullParty);
  if (mode === "opening") return state;
  for (let step = 0; step < 3000; step++) {
    if (reviewPointReady(state, mode, reviewReady)) return nearBattleEnd(state, mode);
    state = settle(state, state.updatedAt + 100);
  }
  throw Error(`${mode} review point was not reached`);
}

function nearBattleEnd(state: State, mode: ReviewMode) {
  if (mode !== "battle-ending") return state;
  const run = state.squads[0].run;
  if (run?.enemies) {
    for (const enemy of run.enemies) if (enemy.hp > 0) enemy.hp = 1;
    syncEnemyTotals(run);
  }
  return state;
}

function reviewReady(state: State, mode: ReviewMode) {
  const run = state.squads[0].run;
  if (mode === "puppet-escape") return puppetEscapeReady(state);
  if (mode.startsWith("waterway")) return waterwayReviewReady(state, mode);
  if (mode.startsWith("moss-")) return waterwayReviewReady(state, mode);
  if (mode === "arrival") return arrivalReady(state);
  if (["battle", "battle-ending"].includes(mode)) return battleReviewReady(state);
  const { look } = chapterRoadFrame({
    squad: state.squads[0],
    startQuest: run?.quest ?? "moss-transplant",
    now: state.updatedAt,
    ready: true,
    paused: false,
    storybookHeroes: true,
  });
  if (mode === "forage") return forageReady(state, look);
  return (
    look.work?.frame === "earthwork" &&
    look.workers.length === 5 &&
    !!run &&
    run.target / run.targetMax < 0.15 &&
    !run.enemies?.some((e) => e.hp > 0)
  );
}
function waterwayReviewReady(state: State, mode: ReviewMode) {
  const run = state.squads[0].run;
  if (!run) return false;
  const nodes: Partial<Record<ReviewMode, number>> = {
    waterway: 5,
    "waterway-cart": 2,
    "waterway-basket": 7,
    "moss-scrape": 3,
    "moss-handoff": 5,
    "moss-final": 14,
    "waterway-stone": 11,
    "waterway-saw": 8,
  };
  return run.node === nodes[mode] && (mode !== "waterway" || !!run.enemies?.some((e) => e.hp > 0));
}
function battleReviewReady(state: State) {
  const run = state.squads[0].run;
  return run?.phase === "work" && run.enemies?.some((e) => e.hp > 0);
}
function forageReady(state: State, look: ReturnType<typeof chapterRoadFrame>["look"]) {
  const run = state.squads[0].run;
  return (
    !!run &&
    run.phase === "work" &&
    ["herb", "moss"].includes(look.work?.frame ?? "") &&
    look.workers.length === 2 &&
    run.target / run.targetMax < 0.8 &&
    !run.enemies?.some((e) => e.hp > 0)
  );
}

function useStudyState(paused: boolean, quest: string, fullParty: boolean) {
  const [snapshot, setSnapshot] = useState<StudySnapshot>({ state: null, lastRun: null });
  const [rendererReady, setRendererReady] = useState(false);
  const onStatusChange = useCallback((status: RendererStatus) => {
    setRendererReady(status === "ready");
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnapshot((current) => {
        if (!current.state) return updateStudySnapshot(current, startStudy(quest, fullParty));
        return paused || !rendererReady
          ? current
          : updateStudySnapshot(current, settle(current.state, current.state.updatedAt + 100));
      });
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [paused, rendererReady, quest, fullParty]);
  const onAction = useCallback((action: Action) => {
    setSnapshot((current) =>
      current.state
        ? updateStudySnapshot(current, act(current.state, action, current.state.updatedAt))
        : current,
    );
  }, []);
  return {
    rendererReady,
    onStatusChange,
    state: snapshot.state,
    snapshot,
    onAction,
    ambushMoss: () => {
      setSnapshot((current) =>
        current.state ? updateStudySnapshot(current, mossAmbushReview(current.state)) : current,
      );
    },
    reset: (packing = false, mode?: ReviewMode) => {
      setRendererReady(false);
      setSnapshot({
        state: mode
          ? reviewStudy(quest, fullParty, mode)
          : packing
            ? packingStudy()
            : startStudy(quest, fullParty),
        lastRun: null,
      });
    },
  };
}

export function AdventureStudy({
  quest = "town-deliveries",
  fullParty = false,
}: {
  quest?: string;
  fullParty?: boolean;
}) {
  const [painted, setPainted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const [lindeProgress, setLindeProgress] = useState<LindeProgress | null>(null);
  const { visualFinished: finished, ...restoration } = useRestorationDialogue();
  const study = useStudyState(paused, quest, fullParty);
  const { state, onAction, reset, onStatusChange } = study;
  const visualState = visibleStudyState(quest, study.snapshot, finished, painted);
  const restart = adventureRestart(
    { setPaused, setReplay, setLindeProgress, reset },
    restoration.resetDialogue,
  );
  return (
    <section>
      <p>{studyDescription(quest, fullParty)}</p>
      <div className="storybook-study-controls">
        <StudyPlaybackControls
          {...{ quest, painted, setPainted, paused, setPaused }}
          completed={forestPreviewFrozen(quest, painted, state)}
        />
        <RestartButtons restart={restart} packing={quest === "town-deliveries"} />
        {fullParty && <CrewReviewButtons restart={restart} />}
        <ForageReviewButtons quest={quest} restart={restart} />
        <HillArrivalButton quest={quest} restart={restart} />
        <NightPushReviewButton quest={quest} restart={restart} />
        <PuppetReviewButton quest={quest} restart={restart} />
        <SignpostReviewButton quest={quest} restart={restart} />
        <BrekkaChapterReviewButtons quest={quest} restart={restart} />
        <WaterwayReviewButton quest={quest} restart={restart} ambush={study.ambushMoss} />
        <StudyAssistControl
          {...{ quest, replay, state, onAction }}
          ready={study.rendererReady && !paused}
        />
      </div>
      <StudyRoad
        {...{ replay, quest, fullParty, painted, onAction, onStatusChange }}
        state={visualState}
        paused={paused || !study.rendererReady || forestPreviewFrozen(quest, painted, state)}
        onVisualComplete={restoration.onVisualComplete}
        onLindeProgress={hasVisualProgress(quest, painted) ? setLindeProgress : undefined}
        restorationDialogue={quest === "berne-restoration" ? restoration.dialogue : undefined}
        {...{ nightWheel: restoration.nightWheel, mossTrailNote: restoration.mossTrailNote }}
        gameComplete={!!state?.done[quest] && !state.squads[0].run}
      />
      <StudyStatusWithReturn key={replay} {...{ quest, state, painted, lindeProgress, finished }} />
      <StudyBanter
        {...{ quest, state: visualState, replay, onCurrentLine: restoration.onCurrentLine }}
        paused={paused || !study.rendererReady}
      />
      <p>この見本は専用の一時データで動き、ゲームの保存内容を変更しません。</p>
    </section>
  );
}

function WaterwayReviewButton({
  quest,
  restart,
  ambush,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
  ambush: () => void;
}) {
  if (quest === "tower-moss-removal")
    return (
      <>
        {(
          [
            ["moss-scrape", "苔を剥がすところから"],
            ["moss-handoff", "籠を渡すところから"],
            ["moss-final", "最後の点検から"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => {
              restart(false, mode);
            }}
          >
            {label}
          </button>
        ))}
        <button onClick={ambush}>襲撃を再現</button>
      </>
    );
  if (quest !== "tower-restoration") return null;
  return (
    <>
      {(
        ["waterway-cart", "waterway", "waterway-basket", "waterway-stone", "waterway-saw"] as const
      ).map((mode, index) => (
        <button
          key={mode}
          onClick={() => {
            restart(false, mode);
          }}
        >
          {
            [
              "道具荷車の配送から",
              "水路の脇の護衛から",
              "枝を籠へ入れるところから",
              "補修石の手渡しから",
              "鋸の片付けから",
            ][index]
          }
        </button>
      ))}
    </>
  );
}
function HillArrivalButton({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (
    quest !== "matching-lantern-stone" &&
    quest !== "manor-survey" &&
    quest !== "garden-reception" &&
    quest !== "keystone-night-road" &&
    quest !== "berne-restoration" &&
    ![
      "riverside-manor",
      "missing-keystone",
      "sweet-blockade",
      "tower-road",
      "village-trade",
      "evening-trade-road",
      "medicine-packing",
      "brekka-arrival",
    ].includes(quest)
  )
    return null;
  return (
    <button
      onClick={() => {
        restart(false, "arrival");
      }}
    >
      {quest === "sweet-blockade"
        ? "最後の人形劇から"
        : quest === "tower-road"
          ? "塔の手前から"
          : quest === "medicine-packing"
            ? "最後の荷造りから"
            : "到着の手前から"}
    </button>
  );
}

function ForageReviewButtons({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (!["forest-wetland", "moonlit-herbs", "tower-road"].includes(quest)) return null;
  const modes: ReviewMode[] =
    quest === "forest-wetland" ? ["forage", "forest-final"] : ["forage", "battle"];
  return (
    <>
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => {
            restart(false, mode);
          }}
        >
          {mode === "forage" ? "採取から" : mode === "forest-final" ? "最後の採取から" : "戦闘から"}
        </button>
      ))}
    </>
  );
}
