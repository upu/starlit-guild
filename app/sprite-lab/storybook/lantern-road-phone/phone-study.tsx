"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import { foundingAmbushReview } from "../founding-ambush-review.ts";
import "../night-bridge-phone/phone-study.css";

function start(quest: string, nearEnd = false, level = 40) {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    level,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (let i = 0; nearEnd && i < 3000 && beforeLastWork(state); i++)
    state = settle(state, state.updatedAt + 100);
  return state;
}
function beforeLastWork(state: State) {
  const run = state.squads[0].run;
  return !!run && run.node < Math.min(13, run.nodes - 1);
}
function assistTrial(state: State) {
  const run = state.squads[0].run;
  return run
    ? act(
        state,
        { type: "assist", mode: run.phase === "rest" ? "heal" : "strike" },
        state.updatedAt,
      )
    : state;
}

function useTrialClock(
  setState: (update: (state: State) => State) => void,
  rapid: boolean,
  running: boolean,
  paused: boolean,
) {
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [setState, paused]);
  useEffect(() => {
    if (!rapid || !running || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setState(assistTrial);
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [rapid, running, setState, paused]);
}

export function ChapterFourPhoneStudy({
  quest,
  controls = true,
  level = 40,
}: {
  quest: string;
  controls?: boolean;
  level?: number;
}) {
  const [state, setState] = useState<State>(() => start(quest, false, level));
  const [rapid, setRapid] = useState(false),
    [paused, setPaused] = useState(false),
    [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure"),
    [sheet, setSheet] = useState<Sheet>(null);
  useTrialClock(setState, rapid, !!state.squads[0].run, paused);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const reset = (nearEnd: boolean) => {
    setState(start(quest, nearEnd, level));
    setRapid(false);
    setPaused(false);
    setVersion((v) => v + 1);
  };
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  return (
    <main className="night-phone-study">
      {controls && (
        <TrialControls
          {...{ rapid, paused, setRapid, setPaused, reset }}
          ambush={
            quest === "starlit-guild-founding"
              ? () => {
                  setState(foundingAmbushReview);
                }
              : undefined
          }
        />
      )}
      <PhoneFrame key={version} model={model} reviewPaused={paused} />
    </main>
  );
}

function TrialControls({
  rapid,
  paused,
  setRapid,
  setPaused,
  reset,
  ambush,
}: {
  rapid: boolean;
  paused: boolean;
  setRapid: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  reset: (nearEnd: boolean) => void;
  ambush?: () => void;
}) {
  return (
    <div className="night-phone-study-controls" aria-label="見本の操作">
      <span>一時データ</span>
      {ambush && <button onClick={ambush}>実戦で中断</button>}
      <button
        onClick={() => {
          setPaused(!paused);
        }}
      >
        {paused ? "再開" : "一時停止"}
      </button>
      <button
        onClick={() => {
          setRapid(!rapid);
        }}
      >
        {rapid ? "連続手助けを止める" : "連続手助けで確認"}
      </button>
      <button
        onClick={() => {
          reset(false);
        }}
      >
        最初から
      </button>
      <button
        onClick={() => {
          reset(true);
        }}
      >
        帰着の手前から
      </button>
    </div>
  );
}
