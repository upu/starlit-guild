"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { LUNCH_INTERLUDE } from "@/lib/chapter-three";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "./study-model";
import "../night-bridge-phone/phone-study.css";

const quest = "berne-restoration";
function start() {
  const state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  return act(
    act(state, { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
}
function complete() {
  let state = start();
  for (let i = 0; i < 3000 && state.squads[0].run; i++) {
    state = settle(state, state.updatedAt + 100);
    if (state.squads[0].run)
      state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
  }
  return state;
}
export default function RestorationPhoneStudy() {
  const [state, setState] = useState<State>(start);
  const [rapid, setRapid] = useState(false);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (!document.hidden) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(tick);
    };
  }, []);
  const running = !!state.squads[0].run;
  useEffect(() => {
    if (!rapid || !running) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setState((s) => act(s, { type: "assist", mode: "strike" }, s.updatedAt));
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [rapid, running]);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet);
  return (
    <main className="night-phone-study">
      <StudyControls
        rapid={rapid}
        toggle={() => {
          setRapid(!rapid);
        }}
        reset={(done) => {
          setState(done ? complete() : start());
          setRapid(false);
          setVersion((v) => v + 1);
        }}
      />
      <PhoneFrame key={version} model={model} />
    </main>
  );
}
function StudyControls({
  rapid,
  toggle,
  reset,
}: {
  rapid: boolean;
  toggle: () => void;
  reset: (done: boolean) => void;
}) {
  return (
    <div className="night-phone-study-controls" aria-label="見本の操作">
      <span>一時データ</span>
      <button onClick={toggle}>{rapid ? "連続手助けを止める" : "連続手助けで確認"}</button>
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
        完了済みで開き直す
      </button>
    </div>
  );
}
