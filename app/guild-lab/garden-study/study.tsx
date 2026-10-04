"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { gardenLabels, gardenPhase, gardenStudy } from "@/lib/home-garden-study";
import { useStudyPlayer } from "../study-player";
import Controls, { type GardenPlayer } from "./controls";
import GardenFigure from "./figure";
const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;
export default function GardenStudy() {
  const p = useStudyPlayer(gardenStudy.duration);
  const [left, setLeft] = useState(false),
    [smooth, setSmooth] = useState(false);
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const props = { time: p.time, left, smooth, guides: p.guides, still: p.still };
  return (
    <main className="tea-study garden-study" data-ready={ready}>
      <nav>
        <Link href="/guild-lab">旅団ホームへ</Link>
        <Link href="/guild-lab/work-study">作業台の見本へ</Link>
      </nav>
      <small>動きの共通見本 / 菜園</small>
      <h1>植物の根元へ、そっと水を注ぐ。</h1>
      <p>手前の腕はオレンジ、体の向こう側の腕は水色です。</p>
      <Options left={left} setLeft={setLeft} smooth={smooth} setSmooth={setSmooth} />
      <Preview p={p} props={props} />
      <Controls p={p} />
      <h2>水やりの4つの姿勢</h2>
      <Frames p={p} props={props} />
      <p className="tea-note">
        足を地面につけたまま、植物の根元へ水を注ぎます。左利きは菜園も含め反対側から見た見本です。5人の絵は、この動きを確認してから制作します。
      </p>
    </main>
  );
}

type FigureProps = Parameters<typeof GardenFigure>[0];
function Options({
  left,
  setLeft,
  smooth,
  setSmooth,
}: {
  left: boolean;
  setLeft: (left: boolean) => void;
  smooth: boolean;
  setSmooth: (smooth: boolean) => void;
}) {
  return (
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
  );
}

function Preview({ p, props }: { p: GardenPlayer; props: FigureProps }) {
  const { left, smooth } = props;
  return (
    <>
      <div className="tea-live garden-live">
        <GardenFigure {...props} />
      </div>
      <p
        className="garden-phase"
        data-time={Math.round(p.time)}
        data-hand={left ? "left" : "right"}
      >
        {gardenLabels[Math.floor(gardenPhase(p.time))]} ／ {smooth ? "滑らかにつなぐ" : "4コマ表示"}
      </p>
      <label className="tea-timeline">
        動きをゆっくり追う
        <input
          type="range"
          min="0"
          max={gardenStudy.duration - 1}
          step="10"
          value={p.time}
          onChange={(e) => {
            p.select(Number(e.target.value));
          }}
        />
      </label>
      <section className="tea-small-section">
        <div className="garden-small">
          <GardenFigure {...props} guides={false} />
        </div>
        <p>ゲーム内に近い大きさ（立ち姿の高さ約48px）</p>
      </section>
    </>
  );
}

function Frames({ p, props }: { p: GardenPlayer; props: FigureProps }) {
  return (
    <div className="tea-sheet garden-sheet">
      {gardenLabels.map((label, i) => (
        <button
          key={label}
          aria-pressed={Math.floor(gardenPhase(p.time)) === i}
          onClick={() => {
            p.select(i * gardenStudy.step);
          }}
        >
          <GardenFigure {...props} time={i * gardenStudy.step} smooth={false} />
          <span>
            {i + 1}. {label}
          </span>
        </button>
      ))}
    </div>
  );
}
