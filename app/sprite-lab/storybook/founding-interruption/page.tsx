"use client";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { act, settle, testState } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { PhaserAdventure } from "../../../phaser-adventure";
import "../../../phaser.css";

const quest = "starlit-guild-founding";
function start(basket = false) {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (
    let step = 0;
    basket && state.squads[0].run && state.squads[0].run.node < 1 && step < 10000;
    step++
  )
    state = settle(state, state.updatedAt + 100);
  return state;
}

function usePreviewClock(
  setState: Dispatch<SetStateAction<ReturnType<typeof start>>>,
  paused: boolean,
) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setState((s) =>
          paused ? { ...s, updatedAt: s.updatedAt + 100 } : settle(s, s.updatedAt + 100),
        );
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [setState, paused]);
}

/** Local-only rehearsal: inject interruptions without touching the save. */
export default function FoundingInterruptionStudy() {
  const [state, setState] = useState(() => start());
  const [resting, setResting] = useState(false);
  const [fighting, setFighting] = useState(false);
  const [replacement, setReplacement] = useState<"aria" | "mira" | null>(null);
  const [version, setVersion] = useState(0);
  usePreviewClock(setState, resting || fighting);
  const squad = state.squads[0];
  const visual = visualSquad(squad, resting, fighting, replacement);
  const reset = (basket: boolean) => {
    setState(start(basket));
    setResting(false);
    setFighting(false);
    setReplacement(null);
    setVersion((value) => value + 1);
  };
  return (
    <main style={{ padding: 8 }}>
      <p>一時データ：荷物を持っている間に中断し、再開後の回収を確認します。</p>
      <StudyControls
        resting={resting}
        toggle={() => {
          setFighting(false);
          setResting((value) => !value);
        }}
        fighting={fighting}
        battle={() => {
          setResting(false);
          setFighting((value) => !value);
        }}
        reset={reset}
        replace={setReplacement}
      />
      <div
        style={{ position: "relative", width: "100%", height: "min(70vh, 700px)", marginTop: 8 }}
      >
        <PhaserAdventure
          key={version}
          input={{
            squad: visual,
            now: state.updatedAt,
            startQuest: quest,
            ready: true,
            paused: false,
          }}
          onAction={() => {}}
        />
      </div>
    </main>
  );
}

function visualSquad(
  squad: ReturnType<typeof start>["squads"][number],
  resting: boolean,
  fighting: boolean,
  replacement: "aria" | "mira" | null,
) {
  if (!squad.run || (!resting && !fighting && !replacement)) return squad;
  const health = { ...squad.run.health };
  const unavailable =
    replacement === "mira" ? (["finn", "leon", "aria"] as const) : (["finn", "leon"] as const);
  if (replacement) for (const id of unavailable) health[id] = { ...health[id], hp: 0 };
  const road = squad.run.road;
  const enemyX = (road?.camera ?? 0) + 170;
  return {
    ...squad,
    run: {
      ...squad.run,
      health,
      ...(resting ? { phase: "rest" as const } : {}),
      ...(fighting && road
        ? {
            enemies: [
              {
                id: "preview-enemy",
                hp: 100,
                maxHp: 100,
                resistance: 0,
                attack: 1,
                period: 1000,
                nextAt: Number.MAX_SAFE_INTEGER,
              },
            ],
            road: {
              ...road,
              opponents: {
                "preview-enemy": {
                  x: enemyX,
                  previousX: enemyX,
                  recoil: 0,
                  walking: false,
                  facing: -1 as const,
                },
              },
            },
          }
        : {}),
    },
  };
}

function StudyControls({
  resting,
  toggle,
  fighting,
  battle,
  reset,
  replace,
}: {
  resting: boolean;
  toggle: () => void;
  fighting: boolean;
  battle: () => void;
  reset: (basket: boolean) => void;
  replace: (hero: "aria" | "mira") => void;
}) {
  return (
    <>
      <button onClick={toggle}>{resting ? "作業を再開" : "休憩で中断"}</button>{" "}
      <button onClick={battle}>{fighting ? "戦闘を終了" : "戦闘で中断"}</button>{" "}
      <button
        onClick={() => {
          reset(false);
        }}
      >
        最初から
      </button>{" "}
      <button
        onClick={() => {
          reset(true);
        }}
      >
        籠の返却から
      </button>{" "}
      <button
        onClick={() => {
          replace("aria");
        }}
      >
        アリアが回収
      </button>{" "}
      <button
        onClick={() => {
          replace("mira");
        }}
      >
        ミラが回収
      </button>
    </>
  );
}
