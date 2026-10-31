"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import "../night-bridge-phone/phone-study.css";

const quest = "town-deliveries";
type ReviewPoint = "first" | "last" | "handoff";
function deliveryPoint(point: ReviewPoint = "last") {
  let state = act(
    testState(1000, 2, 40, 10000),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  for (let i = 0; i < 3000; i++) {
    const run = state.squads[0].run;
    if (
      run &&
      run.node === (point === "last" ? run.nodes - 2 : point === "first" ? 1 : 2) &&
      run.phase === "work" &&
      run.target / run.targetMax < 0.6
    )
      return state;
    state = settle(state, state.updatedAt + 100);
  }
  throw Error("Delivery review point was not reached");
}

function changeHealth(state: State, hero: "aria" | "leon", defeated: boolean) {
  const next = structuredClone(state);
  const health = next.squads[0].run?.health[hero];
  if (health) health.hp = defeated ? 0 : health.maxHp;
  return next;
}

function StudyControls({
  paused,
  toggle,
  reset,
  health,
  node,
}: {
  paused: boolean;
  toggle: () => void;
  reset: (point: ReviewPoint) => void;
  health: (hero: "aria" | "leon" | "both") => void;
  node: number | undefined;
}) {
  return (
    <details className="records-study-tools" open>
      <summary>見本の操作</summary>
      <div className="night-phone-study-controls" aria-label="見本の操作">
        <span>一時データ · 地点 {node === undefined ? "終了" : node + 1}</span>
        <button onClick={toggle}>{paused ? "再生" : "一時停止"}</button>
        <button
          onClick={() => {
            reset("last");
          }}
        >
          最後の配達から
        </button>
        <button
          onClick={() => {
            reset("first");
          }}
        >
          最初の配達から
        </button>
        <button
          onClick={() => {
            reset("handoff");
          }}
        >
          受け渡しから
        </button>
        {(
          [
            ["aria", "アリアが動けない"],
            ["leon", "レオンが動けない"],
            ["both", "二人を回復"],
          ] as const
        ).map(([hero, label]) => (
          <button
            key={hero}
            onClick={() => {
              health(hero);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function TownDeliveryPhoneStudy() {
  const [state, setState] = useState<State>(() => deliveryPoint());
  const [version, setVersion] = useState(0);
  const [paused, setPaused] = useState(true);
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
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  return (
    <main className="night-phone-study">
      <StudyControls
        paused={paused}
        node={state.squads[0].run?.node}
        toggle={() => {
          setPaused(!paused);
        }}
        reset={(point) => {
          setPaused(true);
          setState(deliveryPoint(point));
          setVersion((v) => v + 1);
        }}
        health={(hero) => {
          setState((s) =>
            hero === "both"
              ? changeHealth(changeHealth(s, "aria", false), "leon", false)
              : changeHealth(s, hero, true),
          );
        }}
      />
      <PhoneFrame key={version} model={model} />
    </main>
  );
}
