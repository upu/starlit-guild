"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import { PhoneGame } from "../../../phone-game";
import type { Game } from "../../../phone-game-types";
import { StudyTools } from "../study-tools";
import "../night-bridge-phone/phone-study.css";

const choices = [
  { quest: "lico-records", label: "4-7 消える前に", level: 25 },
  { quest: "mountain-entrance", label: "2-4 山道の入口", level: 18 },
  { quest: "brekka-moss-beds", label: "4-6 塔のそばの苔床", level: 40 },
  { quest: "merrill-seedlings", label: "4-8 苔は渡さない", level: 35 },
  { quest: "keystone-night-road", label: "3-8 間違った荷物を戻す夜", level: 40 },
  { quest: "village-trade", label: "1-1 街への交易", level: 10 },
  { quest: "evening-trade-road", label: "1-2 夕暮れの帰り道", level: 10 },
  { quest: "town-deliveries", label: "1-3 街の配達仕事", level: 10 },
] as const;
type Choice = (typeof choices)[number];

/** The real phone controller receives an in-memory game, without loading any saved profile. */
function IsolatedPhone({ choice, paused }: { choice: Choice; paused: boolean }) {
  const [state, setState] = useState(() => {
    const index = storyStages.findIndex((stage) => stage.quest === choice.quest);
    if (index < 0) throw Error("確認するステージが見つかりません。");
    return testState(1000, index, choice.level, 10000);
  });
  const current = useRef(state);
  const [error, setError] = useState("");
  const dispatch = useCallback((action: Action, onSuccess?: (next: State) => void) => {
    try {
      const next = act(current.current, action, current.current.updatedAt);
      current.current = next;
      setState(next);
      setError("");
      onSuccess?.(next);
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    }
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (paused || document.hidden || !current.current.squads[0].run) return;
      const next = settle(current.current, current.current.updatedAt + 100);
      current.current = next;
      setState(next);
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [paused]);
  // No profile/bundle or persistence actions: this page exercises departure,
  // story completion and the adventure through the unmodified PhoneGame.
  const game = {
    s: state,
    clock: state.updatedAt,
    ready: true,
    otherTab: false,
    error,
    dispatch,
    testToolsEnabled: false,
  } as Game;
  return <PhoneGame game={game} reviewPaused={paused} />;
}

function useTimedPlayback() {
  const [paused, setPaused] = useState(false);
  const stopTimer = useRef<number | undefined>(undefined);
  function stopTimedPlayback() {
    window.clearTimeout(stopTimer.current);
    stopTimer.current = undefined;
  }
  function playFor35Seconds() {
    stopTimedPlayback();
    setPaused(false);
    stopTimer.current = window.setTimeout(() => {
      setPaused(true);
      stopTimer.current = undefined;
    }, 35000);
  }
  useEffect(
    () => () => {
      window.clearTimeout(stopTimer.current);
    },
    [],
  );
  return { paused, setPaused, stopTimedPlayback, playFor35Seconds };
}

export default function DeparturePhoneReview() {
  const [quest, setQuest] = useState<Choice["quest"]>(choices[0].quest);
  const [generation, setGeneration] = useState(0);
  const { paused, setPaused, stopTimedPlayback, playFor35Seconds } = useTimedPlayback();
  const choice = choices.find((item) => item.quest === quest) ?? choices[0];
  return (
    <main className="night-phone-study" data-review-paused={paused ? "true" : "false"}>
      <StudyTools>
        <div className="night-phone-study-controls" aria-label="見本の操作">
          <span>
            保存しない一時データ・Lv{choice.level}・冒険{paused ? "停止中" : "再生中"}
          </span>
          <label>
            出発を確認するステージ
            <select
              aria-label="出発を確認するステージ"
              value={quest}
              onChange={(event) => {
                stopTimedPlayback();
                setPaused(false);
                setQuest(event.target.value as Choice["quest"]);
              }}
            >
              {choices.map((item) => (
                <option value={item.quest} key={item.quest}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              stopTimedPlayback();
              setPaused(false);
              setGeneration((value) => value + 1);
            }}
          >
            出発前へ戻す
          </button>
          <button
            onClick={() => {
              stopTimedPlayback();
              setPaused(!paused);
            }}
          >
            冒険を{paused ? "再生" : "一時停止"}
          </button>
          <button onClick={playFor35Seconds}>冒険を35秒再生</button>
        </div>
      </StudyTools>
      <IsolatedPhone key={`${quest}:${String(generation)}`} choice={choice} paused={paused} />
    </main>
  );
}
