"use client";
import { useCallback, useEffect, useState } from "react";
import { act, settle, testState, type Action, type State } from "@/lib/game";
import { pendingInterlude } from "@/lib/interludes";
import { syncEnemyTotals } from "@/lib/combat";
import { storyStages } from "@/lib/prologue";
import { PhoneFrame } from "../../../phone-game-frame";
import type { Sheet } from "../../../phone-game-types";
import { studyModel } from "../restoration-phone/study-model";
import "../night-bridge-phone/phone-study.css";

const quest = "lico-records";
function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    25,
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
function labelPoint() {
  let state = start();
  for (let i = 0; i < 20000 && state.squads[0].run; i++) {
    const run = state.squads[0].run;
    if (run.enemies?.some((enemy) => enemy.trick === "lico")) break;
    state = settle(state, state.updatedAt + (run.node >= 13 ? 1 : 100));
  }
  return state;
}
function documentsPoint() {
  let state = start();
  for (let i = 0; i < 2000 && state.squads[0].run; i++) {
    const run = state.squads[0].run;
    if (run.node === 0 && run.phase === "work" && run.target <= run.targetMax * 0.15) break;
    state = settle(state, state.updatedAt + 100);
  }
  return state;
}
function smokePoint(patient = "aria") {
  let state = labelPoint();
  const run = state.squads[0].run;
  if (!run?.enemies?.[0]) return state;
  run.actors.sort((a, b) => Number(b.hero === patient) - Number(a.hero === patient));
  run.enemies[0].hp = run.enemies[0].maxHp = 5000;
  syncEnemyTotals(run);
  for (let i = 0; i < 200 && state.squads[0].run; i++) {
    if (state.squads[0].run.events.some((event) => event.text === "リコのしびれ煙で一時的に麻痺"))
      break;
    state = settle(state, state.updatedAt + 100);
  }
  return state;
}

// One remaining HP makes the real next assist finish the encounter in this isolated study.
function finishingPoint(smoke: boolean) {
  const state = smoke ? smokePoint() : labelPoint();
  const run = state.squads[0].run;
  if (run?.enemies?.[0]) {
    run.enemies[0].hp = 1;
    syncEnemyTotals(run);
  }
  return state;
}

// Keep the affected member visibly unable to move during the closing review.
// This longer test-only interval makes the recovery and pickup easy to observe.
function paralyzedFinishingPoint() {
  const state = finishingPoint(false);
  const actor = state.squads[0].run?.actors.find((value) => value.hero === "mira");
  if (actor) actor.paralyzedUntil = state.updatedAt + 15000;
  return state;
}

// Test the closing transition without changing any saved player data.
function defeatedFinishingPoint(hero: "aria" | "mira" | "finn", smoke = false) {
  const state = finishingPoint(smoke);
  const health = state.squads[0].run?.health[hero];
  if (health) health.hp = 0;
  return state;
}
function twoDefeatedFinishingPoint() {
  const state = defeatedFinishingPoint("aria");
  const health = state.squads[0].run?.health.mira;
  if (health) health.hp = 0;
  return state;
}
function smokeParalyzedHelperPoint() {
  const state = finishingPoint(true);
  const mira = state.squads[0].run?.actors.find((actor) => actor.hero === "mira");
  if (mira) mira.paralyzedUntil = state.updatedAt + 60000;
  return state;
}

function studyPoint(kind: StudyPoint) {
  switch (kind) {
    case "documents":
      return documentsPoint();
    case "start":
      return start();
    case "encounter":
      return labelPoint();
    case "paralyzed-quick":
      return paralyzedFinishingPoint();
    case "defeated-aria":
      return defeatedFinishingPoint("aria");
    case "defeated-mira":
      return defeatedFinishingPoint("mira");
    case "defeated-finn":
      return defeatedFinishingPoint("finn");
    case "defeated-pair":
      return twoDefeatedFinishingPoint();
    case "defeated-finn-smoke":
      return defeatedFinishingPoint("finn", true);
    case "smoke-disabled-helper":
      return smokeParalyzedHelperPoint();
    case "quick":
      return finishingPoint(false);
    case "smoke-quick":
      return finishingPoint(true);
    case "mira":
      return smokePoint("mira");
    default:
      return smokePoint("aria");
  }
}

function useStudyTimers(
  rapid: boolean,
  running: boolean,
  frozen: boolean,
  setState: React.Dispatch<React.SetStateAction<State>>,
) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden && !frozen) setState((s) => settle(s, s.updatedAt + 100));
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [frozen, setState]);
  useEffect(() => {
    if (!rapid || !running || frozen) return;
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setState((s) =>
          s.squads[0].run ? act(s, { type: "assist", mode: "strike" }, s.updatedAt) : s,
        );
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [rapid, running, frozen, setState]);
}
export default function LicoRecordsPhoneStudy() {
  const [state, setState] = useState<State>(start);
  const [rapid, setRapid] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [version, setVersion] = useState(0);
  const [view, setView] = useState("adventure");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [closeup, setCloseup] = useState(false);
  useStudyTimers(rapid, !!state.squads[0].run, frozen, setState);
  const dispatch = useCallback((action: Action) => {
    setState((s) => act(s, action, s.updatedAt));
    return true;
  }, []);
  const load = (kind: StudyPoint) => {
    setState(studyPoint(kind));
    setFrozen(
      [
        "encounter",
        "quick",
        "smoke-quick",
        "paralyzed-quick",
        "defeated-aria",
        "defeated-mira",
        "defeated-finn",
        "defeated-pair",
        "defeated-finn-smoke",
        "smoke-disabled-helper",
      ].includes(kind),
    );
    setRapid(false);
    setVersion((v) => v + 1);
  };
  const model = studyModel(state, view, sheet, dispatch, setView, setSheet, quest);
  return (
    <main className={"night-phone-study" + (closeup ? " records-study-closeup" : "")}>
      <details className="records-study-tools" open>
        <summary>見本の操作を開閉</summary>
        <StudyControls
          rapid={rapid}
          frozen={frozen}
          setRapid={setRapid}
          setFrozen={setFrozen}
          load={load}
          closeup={closeup}
          setCloseup={setCloseup}
        />
      </details>
      <PhoneFrame key={version} model={model} />
    </main>
  );
}
type StudyPoint =
  | "documents"
  | "start"
  | "encounter"
  | "smoke"
  | "mira"
  | "quick"
  | "smoke-quick"
  | "paralyzed-quick"
  | "defeated-aria"
  | "defeated-mira"
  | "defeated-finn"
  | "defeated-pair"
  | "defeated-finn-smoke"
  | "smoke-disabled-helper";
type StudyControlProps = {
  rapid: boolean;
  frozen: boolean;
  setRapid: (value: boolean) => void;
  setFrozen: (value: boolean) => void;
  load: (kind: StudyPoint) => void;
  closeup: boolean;
  setCloseup: (value: boolean) => void;
};
function StudyControls({
  rapid,
  frozen,
  setRapid,
  setFrozen,
  load,
  closeup,
  setCloseup,
}: StudyControlProps) {
  return (
    <div className="night-phone-study-controls" aria-label="見本の操作">
      <span>一時データ</span>
      <CloseupButton closeup={closeup} setCloseup={setCloseup} />
      <DocumentsButton load={load} />
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
      <button
        onClick={() => {
          load("start");
        }}
      >
        最初から
      </button>
      <button
        onClick={() => {
          load("encounter");
        }}
      >
        仕掛けの場面から
      </button>
      <button
        onClick={() => {
          load("smoke");
        }}
      >
        しびれの会話を確認（長時間）
      </button>
      <MiraButton load={load} />
      <FinishButtons load={load} />
    </div>
  );
}
function DocumentsButton({ load }: { load: (kind: StudyPoint) => void }) {
  return (
    <button
      onClick={() => {
        load("documents");
      }}
    >
      記録を渡す手前から
    </button>
  );
}
function CloseupButton({
  closeup,
  setCloseup,
}: {
  closeup: boolean;
  setCloseup: (value: boolean) => void;
}) {
  return (
    <button
      onClick={() => {
        setCloseup(!closeup);
      }}
    >
      {closeup ? "通常の大きさ" : "フィンの手元を拡大"}
    </button>
  );
}
const defeatedButtons = [
  ["defeated-aria", "アリア"],
  ["defeated-mira", "ミラ"],
  ["defeated-finn", "フィン"],
  ["defeated-pair", "アリアとミラ"],
] as const;
function FinishButtons({
  load,
}: {
  load: (
    kind:
      | "quick"
      | "smoke-quick"
      | "paralyzed-quick"
      | "defeated-aria"
      | "defeated-mira"
      | "defeated-finn"
      | "defeated-pair"
      | "defeated-finn-smoke"
      | "smoke-disabled-helper",
  ) => void;
}) {
  return (
    <>
      <button
        onClick={() => {
          load("quick");
        }}
      >
        煙が出る前に終了
      </button>
      <button
        onClick={() => {
          load("smoke-quick");
        }}
      >
        煙の後すぐに終了
      </button>
      <button
        onClick={() => {
          load("paralyzed-quick");
        }}
      >
        しびれが残る終了（確認用）
      </button>
      {defeatedButtons.map(([kind, name]) => (
        <button
          key={kind}
          onClick={() => {
            load(kind);
          }}
        >
          {name}が戦闘不能で終了（確認用）
        </button>
      ))}
      <DefeatedSmokeButton load={load} />
      <DisabledHelperButton load={load} />
    </>
  );
}
function DefeatedSmokeButton({ load }: { load: (kind: "defeated-finn-smoke") => void }) {
  return (
    <button
      onClick={() => {
        load("defeated-finn-smoke");
      }}
    >
      煙の後にフィンが戦闘不能（確認用）
    </button>
  );
}
function DisabledHelperButton({ load }: { load: (kind: "smoke-disabled-helper") => void }) {
  return (
    <button
      onClick={() => {
        load("smoke-disabled-helper");
      }}
    >
      煙の後にミラも動けない（確認用）
    </button>
  );
}
function MiraButton({ load }: { load: (kind: "mira") => void }) {
  return (
    <button
      onClick={() => {
        load("mira");
      }}
    >
      ミラがしびれた場合
    </button>
  );
}
