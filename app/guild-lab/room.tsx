"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LabMode, LabPose } from "@/lib/guild-lab-model";
import type { LabControls, createGuildLabGame } from "../phaser/guild-lab-game";
const labels = { tea: "お茶で休憩", walk: "歩く", work: "作業台へ" };
const initialControls: LabControls = {
  mode: "tea",
  request: 0,
  paused: false,
  grid: false,
  close: false,
};
const captions = {
  tea: "椅子でお茶を飲んでいます",
  work: "作業台で手を動かしています",
  walk: "通路を歩いています",
  idle: "目的地に着きました",
};
function useLab() {
  const host = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState<LabControls>(initialControls);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [activity, setActivity] = useState<LabPose>("tea");
  const [retry, setRetry] = useState(0);
  const latest = useRef(controls);
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
  }, [retry]);
  const toggle = (key: "paused" | "grid" | "close") => {
    setControls((c) => ({ ...c, [key]: !c[key] }));
  };
  const restart = () => {
    setStatus("loading");
    setRetry((value) => value + 1);
  };
  return { host, controls, status, activity, visit, toggle, restart };
}
export default function GuildLab() {
  const { host, controls, status, activity, visit, toggle, restart } = useLab();
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
        <p>レオンと過ごす休憩時間。テーブルや作業台を押しても移動できます。</p>
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
          status={status}
          activity={activity}
          visit={visit}
          toggle={toggle}
        />
        <details>
          <summary>今回の試作について</summary>
          <p>
            床・壁をタイルで組み、家具は共通のマス寸法で配置しています。レオンは頭・顔・腕・脚などの画像を重ね、関節の回転で動かしています。目は開閉の差分です。
          </p>
          <p>
            描画だけの試作です。冒険のセーブや生産状況には書き込みません。「動きを減らす」設定では、移動を省略して静止表示します。
          </p>
        </details>
      </div>
    </main>
  );
}

function LabButtons({
  controls,
  status,
  activity,
  visit,
  toggle,
}: Omit<ReturnType<typeof useLab>, "host" | "restart">) {
  return (
    <>
      <div className="guild-lab-actions" role="group" aria-label="レオンの行動">
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
        <button
          aria-pressed={controls.close}
          onClick={() => {
            toggle("close");
          }}
        >
          寄って見る
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
      </div>
      <p className="guild-lab-caption" aria-live="polite">
        {captions[activity]}
      </p>
    </>
  );
}
