"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { syncEnemyTotals } from "@/lib/combat";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import { StudyTools } from "../study-tools";
import "../night-bridge-phone/phone-study.css";

const quest = "merrill-seedlings";
function initialState(heroLevel = 25) {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    heroLevel,
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
function fallenState() {
  let state = initialState();
  for (let i = 0; i < 600; i++) {
    if (state.squads[0].run?.enemies?.[0]?.cue === "summon") break;
    state = settle(state, state.updatedAt + 100);
  }
  state = settle(state, state.updatedAt + 1000);
  const run = state.squads[0].run;
  if (run?.enemies) {
    for (const enemy of run.enemies.slice(1, 3)) enemy.hp = 0;
    syncEnemyTotals(run);
  }
  return state;
}
function finishingState() {
  const state = fallenState();
  const run = state.squads[0].run;
  if (run?.enemies) {
    for (const enemy of run.enemies) enemy.hp = 1;
    syncEnemyTotals(run);
  }
  return state;
}
function weakenedState(current: State) {
  const next = structuredClone(current);
  const run = next.squads[0].run;
  if (run?.enemies) {
    for (const enemy of run.enemies) if (enemy.hp > 0) enemy.hp = 1;
    syncEnemyTotals(run);
  }
  return next;
}
function masterDownState(current: State) {
  const next = structuredClone(current);
  const run = next.squads[0].run;
  const master = run?.enemies?.find((enemy) => enemy.trick === "merrill");
  if (master && run) {
    master.hp = 0;
    syncEnemyTotals(run);
  }
  return next;
}
export default function MerrillSeedlingsPhoneStudy() {
  const [state, setState] = useState<State>(initialState);
  const [frozen, setFrozen] = useState(false),
    [rapid, setRapid] = useState(false);
  const [version, setVersion] = useState(0),
    [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  const active = !!state.squads[0].run;
  const master = state.squads[0].run?.enemies?.find((enemy) => enemy.trick === "merrill");
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden && !frozen) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [frozen]);
  useEffect(() => {
    if (!rapid || frozen || !active) return;
    const timer = window.setInterval(() => {
      setState((s) => act(s, { type: "assist", mode: "strike" }, s.updatedAt));
    }, 80);
    return () => {
      window.clearInterval(timer);
    };
  }, [rapid, frozen, active]);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  const weaken = () => {
    setState(weakenedState);
  };
  const masterDown = () => {
    setState(masterDownState);
  };
  const load = (kind: StudyPoint) => {
    setState(studyPointState(kind));
    setFrozen(kind !== "start" && kind !== "normal");
    setRapid(false);
    setVersion((v) => v + 1);
  };
  return (
    <main
      className="night-phone-study"
      data-battle-cue={master?.cue}
      data-battle-actions={master?.actions}
      data-cue-at={master?.cueAt}
      data-clock={state.updatedAt}
    >
      <StudyControls {...{ frozen, rapid, setFrozen, setRapid, load, weaken, masterDown }} />
      <PhoneFrame key={version} model={model} />
    </main>
  );
}

type StudyPoint = "fallen" | "finishing" | "start" | "opening" | "normal";

function studyPointState(kind: StudyPoint) {
  if (kind === "fallen") return fallenState();
  if (kind === "finishing") return finishingState();
  return initialState(kind === "normal" ? 35 : 25);
}

function StudyControls({
  frozen,
  rapid,
  setFrozen,
  setRapid,
  load,
  weaken,
  masterDown,
}: {
  frozen: boolean;
  rapid: boolean;
  setFrozen: (value: boolean) => void;
  setRapid: (value: boolean) => void;
  load: (kind: StudyPoint) => void;
  weaken: () => void;
  masterDown: () => void;
}) {
  return (
    <StudyTools>
      <div className="night-phone-study-controls" aria-label="見本の操作">
        <span>一時データ</span>
        <button
          onClick={() => {
            setFrozen(!frozen);
          }}
        >
          {frozen ? "再生" : "一時停止"}
        </button>
        <button
          onClick={() => {
            setRapid(!rapid);
          }}
        >
          {rapid ? "連続手助けを止める" : "連続手助けで確認"}
        </button>
        <button onClick={weaken}>この位置から終盤へ</button>
        <button onClick={masterDown}>メリルを先に止める</button>
        <StudyReplayButtons load={load} />
      </div>
    </StudyTools>
  );
}

function StudyReplayButtons({ load }: { load: (kind: StudyPoint) => void }) {
  return (
    <>
      {(
        [
          ["opening", "出会いを確認"],
          ["fallen", "倒れた後を確認"],
          ["finishing", "終了直前を確認"],
          ["start", "最初から"],
          ["normal", "Lv35で通し確認"],
        ] as const
      ).map(([kind, label]) => (
        <button
          key={kind}
          onClick={() => {
            load(kind);
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
