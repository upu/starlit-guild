"use client";
import { useState } from "react";
import { act, settle, testState } from "@/lib/game";
import { PhaserAdventure } from "../../../phaser-adventure";
import "../study.css";

function finalPoint() {
  let state = act(
    testState(1000, 5, 40, 10000),
    { type: "start", id: "forest-wetland", readDeparture: true, value: false },
    1000,
  );
  for (let i = 0; i < 3000 && state.squads[0].run && state.squads[0].run.node < 14; i++)
    state = settle(state, state.updatedAt + 100);
  return state;
}

export default function Page() {
  const [state] = useState(finalPoint);
  return (
    <main className="storybook-study">
      <h1>森の採取から帰還へ</h1>
      <p>最後の採取から帰還直前の配置まで再生します。</p>
      <div className="storybook-adventure">
        <PhaserAdventure
          input={{
            squad: state.squads[0],
            startQuest: "forest-wetland",
            now: state.updatedAt,
            ready: true,
            paused: false,
            forestFinalizing: true,
          }}
          onAction={() => {}}
        />
      </div>
    </main>
  );
}
