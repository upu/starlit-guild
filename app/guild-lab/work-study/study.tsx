"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { workLabels, workPhase, workStudy } from "@/lib/home-work-study";
import { useStudyPlayer } from "../study-player";
import { Controls, type WorkPlayer } from "./controls";
import WorkFigure from "./figure";
const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;
function Frames({ p, left }: { p: WorkPlayer; left: boolean }) {
  return (
    <div className="tea-sheet work-sheet">
      {workLabels.map((label, i) => (
        <button
          key={label}
          aria-pressed={Math.floor(workPhase(p.time)) === i}
          onClick={() => {
            p.select(i * workStudy.step);
          }}
        >
          <WorkFigure time={i * workStudy.step} guides={p.guides} left={left} />
          <span>
            {i + 1}. {label}
          </span>
        </button>
      ))}
    </div>
  );
}
function Preview({ p, left, smooth }: { p: WorkPlayer; left: boolean; smooth: boolean }) {
  return (
    <>
      <div className="tea-live work-live">
        <WorkFigure time={p.time} guides={p.guides} left={left} smooth={smooth} />
      </div>
      <p className="work-phase" data-time={Math.round(p.time)} data-hand={left ? "left" : "right"}>
        {workLabels[Math.floor(workPhase(p.time))]} ／ {smooth ? "滑らかにつなぐ" : "4コマ表示"}
      </p>
      <label className="tea-timeline">
        動きをゆっくり追う
        <input
          type="range"
          min="0"
          max={workStudy.duration - 1}
          step="10"
          value={p.time}
          onChange={(e) => {
            p.select(Number(e.target.value));
          }}
        />
      </label>
      <section className="tea-small-section">
        <div className="work-small">
          <WorkFigure time={p.time} left={left} smooth={smooth} />
        </div>
        <p>ゲーム内に近い大きさ（人物の高さ約48px）</p>
      </section>
    </>
  );
}
export default function WorkStudy() {
  const p = useStudyPlayer(workStudy.duration);
  const [left, setLeft] = useState(false),
    [smooth, setSmooth] = useState(false);
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  return (
    <main className="tea-study work-study" data-ready={ready}>
      <nav>
        <Link href="/guild-lab">旅団ホームへ</Link>
        <Link href="/guild-lab/walk-study">歩行の見本へ</Link>
        <Link href="/guild-lab/tea-study">お茶の見本へ</Link>
      </nav>
      <small>動きの共通見本 / 作業台</small>
      <h1>台に向かって、手を動かす。</h1>
      <p>
        手を伸ばす→手元を動かす→身を寄せる→戻す。手前の腕はオレンジ、体の向こう側の腕は水色です。
      </p>
      <div className="tea-controls">
        <button
          aria-pressed={!left}
          onClick={() => {
            setLeft(false);
          }}
        >
          右利き
        </button>
        <button
          aria-pressed={left}
          onClick={() => {
            setLeft(true);
          }}
        >
          左利き（リコ）
        </button>
        <label>
          <input
            type="checkbox"
            checked={smooth}
            onChange={(e) => {
              setSmooth(e.target.checked);
            }}
          />
          滑らかにつなぐ
        </label>
      </div>
      <Preview p={p} left={left} smooth={smooth} />
      <Controls p={p} />
      <h2>作業の4つの姿勢</h2>
      <Frames p={p} left={left} />
      <p className="tea-note">
        手元に集中して、肩と上半身も少し前へ。道具を持たない共通の作業姿勢です。左利きは台も含め反対側から見た見本です。
      </p>
    </main>
  );
}
