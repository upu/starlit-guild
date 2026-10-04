"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { teaLabels, teaPhase, teaStudy } from "@/lib/home-tea-study";
import TeaFigure from "./figure";
import { useTeaPlayer } from "./player";
import TeaResidents from "./residents";
const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;
type Player = ReturnType<typeof useTeaPlayer>;
function Controls({ p }: { p: Player }) {
  const phase = Math.floor(teaPhase(p.time));
  return (
    <div className="tea-controls">
      <button
        disabled={p.still}
        onClick={() => {
          p.setPlaying(!p.playing);
        }}
      >
        {p.playing ? "一時停止" : "再生"}
      </button>
      <button
        onClick={() => {
          p.select((phase - 1) * teaStudy.step);
        }}
      >
        前の姿勢
      </button>
      <button
        onClick={() => {
          p.select((phase + 1) * teaStudy.step);
        }}
      >
        次の姿勢
      </button>
      <label>
        <input
          type="checkbox"
          checked={p.slow}
          onChange={(e) => {
            p.setSlow(e.target.checked);
          }}
        />
        ゆっくり
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.guides}
          onChange={(e) => {
            p.setGuides(e.target.checked);
          }}
        />
        関節と座面
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.still}
          onChange={(e) => {
            p.reduce(e.target.checked);
          }}
        />
        動きを減らす
      </label>
    </div>
  );
}
function PhaseSheet({ p }: { p: Player }) {
  return (
    <div className="tea-sheet">
      {teaLabels.map((label, i) => (
        <button
          key={label}
          aria-pressed={Math.floor(teaPhase(p.time)) === i}
          onClick={() => {
            p.select((i + 0.5) * teaStudy.step);
          }}
        >
          <TeaFigure time={(i + 0.5) * teaStudy.step} guides={p.guides} />
          <span>
            {i + 1}. {label}
          </span>
        </button>
      ))}
    </div>
  );
}
export default function TeaStudy() {
  const p = useTeaPlayer();
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  return (
    <main className="tea-study" data-ready={ready}>
      <nav>
        <Link href="/guild-lab">旅団ホームへ</Link>
        <Link href="/guild-lab/walk-study">歩行の見本へ</Link>
        <Link href="/guild-lab/work-study">作業台の見本へ</Link>
      </nav>
      <small>動きの共通見本 / お茶と会話</small>
      <h1>ひと息ついて、隣の仲間と。</h1>
      <p>
        テーブルの高さで構える→持ち上げる→飲む→下ろす、の4つ。笑顔やうなずきは、構えている間の別の反応として重ねます。
      </p>
      <div className="tea-live">
        <TeaFigure time={p.time} guides={p.guides} />
      </div>
      <Controls p={p} />
      <TeaResidents time={p.time} still={p.still} select={p.select} />
      <p className="tea-phase" data-time={Math.round(p.time)}>
        左の人：{teaLabels[Math.floor(teaPhase(p.time))]} ／ 右の人：
        {teaLabels[Math.floor(teaPhase(p.time + teaStudy.duration / 2))]}
      </p>
      <label className="tea-timeline">
        動きをゆっくり追う
        <input
          type="range"
          min="0"
          max={teaStudy.duration - 1}
          step="20"
          value={p.time}
          onChange={(e) => {
            p.select(Number(e.target.value));
          }}
        />
      </label>
      <section className="tea-small-section">
        <div className="tea-small">
          <TeaFigure time={p.time} />
        </div>
        <p>ゲーム内に近い大きさ（人物の高さ約48px）</p>
      </section>
      <h2>飲む動きは4つ</h2>
      <p>左の人を基準に並べています。選ぶと、その姿勢で止まります。</p>
      <PhaseSheet p={p} />
      <p className="tea-note">
        見本のオレンジが手前、青が奥の手足。腰は座面、足裏は床に置き、もう片方の手はひざ元へ。見本の2人は鏡像ですが、仲間の絵は左右向きそれぞれで利き手を保っています。
      </p>
    </main>
  );
}
