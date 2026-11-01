"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import "../night-bridge-phone/phone-study.css";

const quest = "brekka-moss-beds";
function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
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
function surveyPoint(node: number) {
  let state = start();
  for (let i = 0; i < 3000 && state.squads[0].run && state.squads[0].run.node < node; i++)
    state = settle(state, state.updatedAt + 100);
  return state;
}

function useStudyTimers(
  rapid: boolean,
  running: boolean,
  setState: React.Dispatch<React.SetStateAction<State>>,
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
      if (!document.hidden)
        setState((s) => act(s, { type: "assist", mode: "strike" }, s.updatedAt));
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [rapid, running, setState, paused]);
}
export default function MossBedsPhoneStudy() {
  const [state, setState] = useState<State>(start);
  const [rapid, setRapid] = useState(false);
  const [paused, setPaused] = useState(false);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  useStudyTimers(rapid, !!state.squads[0].run, setState, paused);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  const reset = (node = 0) => {
    setState(surveyPoint(node));
    setRapid(false);
    setPaused(false);
    setVersion((v) => v + 1);
  };
  return (
    <main className="night-phone-study">
      <div className="night-phone-study-controls" aria-label="見本の操作">
        <span>一時データ</span>
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
        <SurveyRestartButtons reset={reset} />
      </div>
      <PhoneFrame key={version} model={model} reviewPaused={paused} />
    </main>
  );
}
function SurveyRestartButtons({ reset }: { reset: (node?: number) => void }) {
  return (
    <>
      {(
        [
          [0, "最初から"],
          [6, "札を読むところから"],
          [14, "帰着の手前から"],
        ] as const
      ).map(([node, label]) => (
        <button
          key={node}
          onClick={() => {
            reset(node);
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
