"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import { LindeStudyControls } from "./controls";
import "../night-bridge-phone/phone-study.css";

const quest = "linde-requests";
function start(courier = "all") {
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
  const run = state.squads[0].run;
  if (run && courier !== "all")
    for (const [id, health] of Object.entries(run.health)) if (id !== courier) health.hp = 0;
  return state;
}
function nearEnd(courier: string) {
  let state = start(courier);
  for (let i = 0; i < 3000 && state.squads[0].run && state.squads[0].run.node < 13; i++)
    state = settle(state, state.updatedAt + 100);
  return state;
}
function downBefore(current: State, replacement: string) {
  const next = structuredClone(current);
  const health = next.squads[0].run?.health;
  const priority = ["leon", "aria", "mira", "finn"];
  if (health) for (const id of priority.slice(0, priority.indexOf(replacement))) health[id].hp = 0;
  return next;
}

export default function LindeDeliveryPhoneStudy() {
  const [state, setState] = useState<State>(start);
  const [rapid, setRapid] = useState(false);
  const [courier, setCourier] = useState("all");
  const [replacement, setReplacement] = useState("aria");
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  const running = !!state.squads[0].run;
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
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
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  return (
    <main className="night-phone-study">
      <LindeStudyControls
        rapid={rapid}
        courier={courier}
        replacement={replacement}
        selectReplacement={setReplacement}
        selectCourier={(id) => {
          setCourier(id);
          setState(start(id));
          setRapid(false);
          setVersion((v) => v + 1);
        }}
        downLeon={() => {
          setState((current) => downBefore(current, replacement));
        }}
        toggle={setRapid.bind(null, !rapid)}
        reset={(near) => {
          setState(near ? nearEnd(courier) : start(courier));
          setRapid(false);
          setVersion((v) => v + 1);
        }}
      />
      <PhoneFrame key={version} model={model} />
    </main>
  );
}
