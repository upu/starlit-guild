"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { syncEnemyTotals } from "@/lib/combat";
import { LUNCH_INTERLUDE } from "@/lib/chapter-three";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import { nightPushReady } from "../adventure-review-points";
import { StudyTools } from "../study-tools";
import "./phone-study.css";

const quest = "keystone-night-road";
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

function nearNode(node: number) {
  let state = start();
  for (
    let i = 0;
    i < 3000 &&
    state.squads[0].run &&
    (node === 1 ? !nightPushReady(state) : state.squads[0].run.node < node);
    i++
  )
    state = settle(state, state.updatedAt + 100);
  return state;
}

function longBattle() {
  let state = start();
  for (let i = 0; i < 200 && state.squads[0].run && !state.squads[0].run.enemies?.length; i++)
    state = settle(state, state.updatedAt + 100);
  const run = state.squads[0].run;
  if (run?.enemies?.[0]) {
    run.enemies[0].hp = run.enemies[0].maxHp = 5000;
    syncEnemyTotals(run);
  }
  return state;
}

export default function NightBridgePhoneStudy() {
  const [state, setState] = useState<State>(start);
  const [rapid, setRapid] = useState(false);
  const [paused, setPaused] = useState(false);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden && !paused) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [paused]);
  const running = !!state.squads[0].run;
  useEffect(() => {
    if (!rapid || !running || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setState((s) => act(s, { type: "assist", mode: "strike" }, s.updatedAt));
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [paused, rapid, running]);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  return (
    <main className="night-phone-study">
      <StudyControls
        rapid={rapid}
        paused={paused}
        togglePause={() => {
          setPaused(!paused);
        }}
        toggle={() => {
          setRapid(!rapid);
        }}
        reset={(node) => {
          setState(node === -1 ? longBattle() : node ? nearNode(node) : start());
          setRapid(false);
          setPaused(node === 4);
          setVersion((v) => v + 1);
        }}
      />
      <PhoneFrame key={version} model={model} />
    </main>
  );
}

function StudyControls({
  rapid,
  paused,
  togglePause,
  toggle,
  reset,
}: {
  rapid: boolean;
  paused: boolean;
  togglePause: () => void;
  toggle: () => void;
  reset: (node: number) => void;
}) {
  return (
    <StudyTools>
      <div className="night-phone-study-controls" aria-label="見本の操作">
        <span>一時データ</span>
        <button onClick={togglePause}>{paused ? "進行を再開" : "進行を一時停止"}</button>
        <button onClick={toggle}>{rapid ? "連続手助けを止める" : "連続手助けで確認"}</button>
        <NightRestartButtons reset={reset} />
      </div>
    </StudyTools>
  );
}

function NightRestartButtons({ reset }: { reset: (node: number) => void }) {
  return (
    <>
      {(
        [
          [0, "最初から"],
          [-1, "戦闘姿勢を確認（長時間）"],
          [1, "荷車の運搬から"],
          [4, "景色の切り替え手前から"],
          [13, "到着の手前から"],
          [7, "橋が見えてから"],
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
