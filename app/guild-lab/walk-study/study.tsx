"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { walkStudyLabels } from "@/lib/home-walk-study";
import { WalkFigure } from "./figure";
import { WalkPilot } from "./pilot";
const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;
function useWalkPlayer() {
  const [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(false);
  const [guides, setGuides] = useState(true),
    [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => {
        setFrame((f) => (f + 1) % 8);
      },
      slow ? 240 : 100,
    );
    return () => {
      clearInterval(timer);
    };
  }, [playing, slow]);
  const select = (next: number) => {
    setPlaying(false);
    setFrame((next + 8) % 8);
  };
  return { frame, playing, guides, slow, setPlaying, setGuides, setSlow, select };
}
type Player = ReturnType<typeof useWalkPlayer>;
function Controls({ p }: { p: Player }) {
  return (
    <div className="walk-controls">
      <button
        onClick={() => {
          p.setPlaying(!p.playing);
        }}
      >
        {p.playing ? "一時停止" : "再生"}
      </button>
      <button
        onClick={() => {
          p.select(p.frame - 1);
        }}
      >
        前のコマ
      </button>
      <button
        onClick={() => {
          p.select(p.frame + 1);
        }}
      >
        次のコマ
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
        関節と手の軌跡
      </label>
    </div>
  );
}
function Sheet({ p }: { p: Player }) {
  return (
    <div className="walk-sheet">
      {walkStudyLabels.map((label, i) => (
        <button
          key={i}
          aria-pressed={p.frame === i}
          onClick={() => {
            p.select(i);
          }}
        >
          <WalkFigure frame={i} guides={p.guides} />
          <span>
            {i + 1}. {label}
          </span>
        </button>
      ))}
    </div>
  );
}
export default function WalkStudy() {
  const p = useWalkPlayer();
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  return (
    <main className="walk-study" data-ready={ready}>
      <Link href="/guild-lab">旅団ホームの試作へ戻る</Link>
      <h1>みんなの歩行見本</h1>
      <p>オレンジが手前の手足、青が奥の手足。腕は足と逆に振り、真下を通って戻ります。</p>
      <div className="walk-live">
        <div className="walk-large">
          <WalkFigure frame={p.frame} guides={p.guides} />
        </div>
        <div>
          <div className="walk-small">
            <WalkFigure frame={p.frame} />
          </div>
          <p>ゲーム内に近い大きさ</p>
        </div>
      </div>
      <Controls p={p} />
      <p className="walk-phase">
        {p.frame + 1} / 8：{walkStudyLabels[p.frame]}
      </p>
      <Sheet p={p} />
      <WalkPilot frame={p.frame} select={p.select} />
      <p>
        見本の色や人形の絵柄はゲームには使いません。仲間の比較には、旅団と同じ画像・コマ順・体の上下動を使っています。
      </p>
    </main>
  );
}
