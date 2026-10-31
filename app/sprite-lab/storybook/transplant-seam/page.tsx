"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { stories } from "@/lib/stories";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import "../night-bridge-phone/phone-study.css";

const quest = "moss-transplant";
const story = stories.find((item) => item.id === `${quest}-departure`);

function startState() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  return state;
}

/** The normal reader, exit and adventure start, with disposable state. */
export default function TransplantSeamReview() {
  const [state, setState] = useState<State>(startState);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>("story");
  const [paused, setPaused] = useState(true);
  const running = !!state.squads[0].run;
  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setState((current) => settle(current, current.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [running, paused]);
  const dispatch = useCallback((action: Action) => {
    setState((current) => act(current, action, current.updatedAt));
    return true;
  }, []);
  if (!story) throw new Error("Missing transplant departure story");
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  model.reading = story;
  const departure = { type: "start" as const, id: quest, squad: state.squads[0].id, value: false };
  model.pendingDeparture = departure;
  model.reviewStartPage = story.lines.length - 1;
  model.finishStory = () => {
    const next = act(state, { ...departure, readDeparture: true }, state.updatedAt);
    if (!next.squads[0].run) return false;
    setState(next);
    return true;
  };
  model.closeStory = () => {
    setSheet(null);
  };
  return (
    <main className="night-phone-study">
      <Playback
        running={running}
        paused={paused}
        pause={setPaused}
        step={() => {
          setState((current) => settle(current, current.updatedAt + 500));
        }}
      />
      <PhoneFrame model={model} />
    </main>
  );
}
function Playback({
  running,
  paused,
  pause,
  step,
}: {
  running: boolean;
  paused: boolean;
  pause: (value: boolean) => void;
  step: () => void;
}) {
  return (
    <div className="night-phone-study-controls" aria-label="見本の操作">
      <span>一時データ</span>
      {running && (
        <>
          <button
            onClick={() => {
              pause(!paused);
            }}
          >
            {paused ? "冒険を再生" : "冒険を一時停止"}
          </button>
          <button
            disabled={!paused}
            onClick={() => {
              step();
            }}
          >
            0.5秒進める
          </button>
        </>
      )}
    </div>
  );
}
