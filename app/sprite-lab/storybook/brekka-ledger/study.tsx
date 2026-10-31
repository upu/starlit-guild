"use client";
import { useEffect, useState } from "react";
import { act, settle, testState } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { storyStages } from "@/lib/prologue";
import { brekkaLedgerAssets } from "@/lib/road-brekka-ledger";
import { PhaserAdventure } from "../../../phaser-adventure";
import "../study.css";

function setup() {
  const quest = "brekka-arrival";
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
    let i = 0;
    i < 3000 && !(state.squads[0].run?.node === 2 && state.squads[0].run.phase === "work");
    i++
  )
    state = settle(state, state.updatedAt + 100);
  if (state.squads[0].run?.node !== 2) throw Error("Brekka ledger review point not reached");
  return state;
}

export function BrekkaLedgerStudy({ portrait = false }: { portrait?: boolean }) {
  const [state] = useState(setup);
  const [now, setNow] = useState(state.updatedAt);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) setNow((value) => value + 50);
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, []);
  return (
    <main className={`storybook-study${portrait ? " lantern-road-portrait" : ""}`}>
      <h1>ブレッカの仕入れ調査・試作</h1>
      <p>一時データで、フィンが醸造所の控えを確かめる位置と動きを確認します。</p>
      <button
        onClick={() => {
          setNow(state.updatedAt);
          setReplay((value) => value + 1);
        }}
      >
        最初から
      </button>
      <div className="storybook-adventure">
        <PhaserAdventure
          key={replay}
          input={{
            squad: state.squads[0],
            startQuest: "brekka-arrival",
            now,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: brekkaLedgerAssets.bank,
          }}
          onAction={() => {}}
        />
      </div>
      <p>この見本はゲームの保存内容を変更しません。</p>
    </main>
  );
}
