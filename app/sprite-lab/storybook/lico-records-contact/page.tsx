"use client";
import { useState } from "react";
import { act, settle, testState } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import type { TravellerId } from "@/lib/road-view";
import { PhaserAdventure } from "../../../phaser-adventure";
import "../../../phaser.css";

const quest = "lico-records";
function sampleBattle() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    25,
    10000,
  );
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (let i = 0; i < 20000 && state.squads[0].run; i++) {
    const run = state.squads[0].run;
    if (run.enemies?.some((enemy) => enemy.trick === "lico")) break;
    state = settle(state, state.updatedAt + (run.node >= 13 ? 1 : 100));
  }
  return state;
}
export default function RecordsContactStudy() {
  const [state] = useState(sampleBattle);
  const [cue, setCue] = useState<"other" | "support" | "bottle">("other");
  const [closing, setClosing] = useState(false);
  const [patient, setPatient] = useState<TravellerId>("aria");
  const text =
    cue === "support"
      ? "無理に動かさないで。私が支えるわ。"
      : cue === "bottle"
        ? "動ける方で栓を閉めよう。こっちの瓶もかい？"
        : "その板、踏まないで。……近づくなら、足を止めるよ。";
  return (
    <main style={{ padding: 8 }}>
      <p>一時データ・手元の接触確認</p>
      <ContactControls
        patient={patient}
        setPatient={setPatient}
        setCue={setCue}
        setClosing={setClosing}
      />
      <div
        style={{ position: "relative", width: "100%", height: "min(70vh, 700px)", marginTop: 8 }}
      >
        <PhaserAdventure
          input={{
            squad: state.squads[0],
            now: state.updatedAt,
            startQuest: quest,
            ready: true,
            paused: false,
            recordsDialogue: { cue, patient },
            recordsClosing: closing,
          }}
          onAction={() => {}}
        />
      </div>
      <p>{text}</p>
    </main>
  );
}
function ContactControls({
  patient,
  setPatient,
  setCue,
  setClosing,
}: {
  patient: TravellerId;
  setPatient: (value: TravellerId) => void;
  setCue: (value: "other" | "support" | "bottle") => void;
  setClosing: (value: boolean) => void;
}) {
  return (
    <>
      <button
        onClick={() => {
          setCue("other");
          setClosing(false);
        }}
      >
        立ち位置
      </button>{" "}
      <button
        onClick={() => {
          setCue("support");
          setClosing(false);
        }}
      >
        支える
      </button>{" "}
      <button
        onClick={() => {
          setCue("bottle");
          setClosing(false);
        }}
      >
        瓶の栓
      </button>{" "}
      <button
        onClick={() => {
          setClosing(true);
        }}
      >
        着座
      </button>{" "}
      <label>
        対象{" "}
        <select
          value={patient}
          onChange={(event) => {
            setPatient(event.target.value as TravellerId);
          }}
        >
          <option value="aria">アリア</option>
          <option value="leon">レオン</option>
          <option value="finn">フィン</option>
        </select>
      </label>
    </>
  );
}
