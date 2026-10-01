"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LabMode, LabPose } from "@/lib/guild-lab-model";
import type { LabControls, createGuildLabGame } from "../phaser/guild-lab-game";
const labels = { tea: "2人でお茶", walk: "2人で歩く", work: "作業台へ", detour: "アリアが寄り道" };
const initialControls: LabControls = {
  mode: "tea",
  request: 0,
  paused: false,
  grid: false,
  view: "auto",
  greet: 0,
};
const captions = {
  tea: "2人でお茶を飲んでいます",
  work: "作業台で手を動かしています",
  walk: "通路を歩いています",
  idle: "目的地に着きました",
  detour: "アリアが気になるものを見つけました",
};
function useLab() {
  const host = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<LabControls>(initialControls);
  const { status, setStatus, retry, restart } = useLabStatus();
  const [activity, setActivity] = useState<LabPose>("tea");
  const latest = useRef(controls);
  const narrow = useNarrowScreen();
  useEffect(() => {
    latest.current = controls;
  }, [controls]);
  const visit = (mode: LabMode) => {
    setControls((c) => ({ ...c, mode, request: c.request + 1 }));
  };
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let disposed = false,
      game: ReturnType<typeof createGuildLabGame> | undefined;
    void Promise.all([import("phaser"), import("../phaser/guild-lab-game")])
      .then(([{ default: Phaser }, { createGuildLabGame }]) => {
        if (disposed) return;
        game = createGuildLabGame(
          parent,
          {
            read: () => latest.current,
            visit: (mode) => {
              setControls((c) => ({ ...c, mode, request: c.request + 1 }));
            },
            status: (value) => {
              if (!disposed) setStatus(value);
            },
            activity: (value) => {
              if (!disposed) setActivity(value);
            },
          },
          Phaser,
        );
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      game?.destroy();
    };
  }, [retry, setStatus]);
  const close = controls.view === "residents" || (controls.view === "auto" && narrow);
  const toggle = (key: "paused" | "grid" | "close") => {
    setControls((c) =>
      key === "close" ? { ...c, view: close ? "room" : "residents" } : { ...c, [key]: !c[key] },
    );
  };
  const greet = () => {
    setControls((c) => ({ ...c, greet: c.greet + 1 }));
  };
  const stretch = () => {
    setControls((c) => ({ ...c, stretch: (c.stretch ?? 0) + 1 }));
  };
  return { host, controls, close, status, activity, visit, toggle, restart, greet, stretch };
}
function useLabStatus() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const restart = () => {
    setStatus("loading");
    setRetry((value) => value + 1);
  };
  return { status, setStatus, retry, restart };
}
function useNarrowScreen() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 599px)");
    const sync = () => {
      setNarrow(query.matches);
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
    };
  }, []);
  return narrow;
}
export default function GuildLab() {
  const { host, controls, close, status, activity, visit, toggle, restart, greet, stretch } =
    useLab();
  return (
    <main className="guild-lab">
      <div className="guild-lab-inner">
        <header>
          <div>
            <small>星灯りの旅団 / 描画の試作</small>
            <h1>小さな旅団ホーム</h1>
          </div>
          <Link href="/">ゲームへ戻る</Link>
        </header>
        <p>レオンとアリアが過ごす休憩時間。2人のしぐさや、ささやかなやり取りを試せます。</p>
        <div className="guild-lab-stage" data-status={status} data-activity={activity}>
          <div ref={host} className="guild-lab-canvas" aria-hidden="true" />
          {status !== "ready" && (
            <div className="guild-lab-loading" role="status">
              {status === "error" ? (
                <button onClick={restart}>景色を読み直す</button>
              ) : (
                "部屋を支度中…"
              )}
            </div>
          )}
        </div>
        <LabButtons
          controls={controls}
          close={close}
          status={status}
          activity={activity}
          visit={visit}
          toggle={toggle}
          greet={greet}
          stretch={stretch}
        />
        <details>
          <summary>今回の試作について</summary>
          <p>
            お茶を楽しんだり、気になるものへ寄り道したり。キャラやテーブル、作業台にも触れられます。
          </p>
          <p>
            描画だけの試作です。冒険のセーブや生産状況には書き込みません。「動きを減らす」設定でも、表情と気持ちのマークは表示します。
          </p>
        </details>
      </div>
    </main>
  );
}

function LabButtons({
  controls,
  close,
  status,
  activity,
  visit,
  toggle,
  greet,
  stretch,
}: Omit<ReturnType<typeof useLab>, "host" | "restart">) {
  return (
    <>
      <div className="guild-lab-actions" role="group" aria-label="旅団の行動">
        {(Object.keys(labels) as LabMode[]).map((mode) => (
          <button
            key={mode}
            disabled={status !== "ready"}
            aria-pressed={controls.mode === mode}
            onClick={() => {
              visit(mode);
            }}
          >
            {labels[mode]}
          </button>
        ))}
      </div>
      <div className="guild-lab-options">
        <button disabled={status !== "ready" || controls.paused} onClick={greet}>
          レオンに声をかける
        </button>
        <button disabled={status !== "ready" || controls.paused} onClick={stretch}>
          伸びを試す
        </button>
        <LabViewButtons controls={controls} close={close} toggle={toggle} />
      </div>
      <p className="guild-lab-caption" aria-live="polite">
        {captions[activity]}
      </p>
    </>
  );
}

function LabViewButtons({
  controls,
  close,
  toggle,
}: Pick<ReturnType<typeof useLab>, "controls" | "close" | "toggle">) {
  return (
    <>
      <button
        aria-pressed={close}
        onClick={() => {
          toggle("close");
        }}
      >
        {close ? "部屋全体" : "住人を追う"}
      </button>
      <button
        aria-pressed={controls.paused}
        onClick={() => {
          toggle("paused");
        }}
      >
        {controls.paused ? "動きを再開" : "一時停止"}
      </button>
      <button
        aria-pressed={controls.grid}
        onClick={() => {
          toggle("grid");
        }}
      >
        タイルと関節を見る
      </button>
    </>
  );
}
