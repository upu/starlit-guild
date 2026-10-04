"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { gardenLabels, gardenPhase, gardenStudy, type GardenAction } from "@/lib/home-garden-study";
import { useStudyPlayer } from "../study-player";
import Controls, { type GardenPlayer } from "./controls";
import GardenFigure from "./figure";
const subscribe = () => () => undefined;
const clientReady = () => true;
const serverReady = () => false;
export default function GardenStudy() {
  const p = useStudyPlayer(gardenStudy.duration);
  const [action, setAction] = useState<GardenAction>("water"),
    [left, setLeft] = useState(false),
    [smooth, setSmooth] = useState(false);
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const props = { action, time: p.time, left, smooth, guides: p.guides, still: p.still };
  return (
    <main className="tea-study garden-study" data-ready={ready}>
      <nav>
        <Link href="/guild-lab">旅団ホームへ</Link>
        <Link href="/guild-lab/work-study">作業台の見本へ</Link>
      </nav>
      <small>動きの共通見本 / 菜園</small>
      <h1>水を注いで、育ち具合を見る。</h1>
      <p>手前の腕はオレンジ、体の向こう側の腕は水色です。</p>
      <Options
        action={action}
        setAction={setAction}
        left={left}
        setLeft={setLeft}
        smooth={smooth}
        setSmooth={setSmooth}
        p={p}
      />
      <Preview p={p} props={props} />
      <Controls p={p} />
      <h2>{action === "water" ? "水やり" : "観察"}の4つの姿勢</h2>
      <Frames p={p} props={props} />
      <p className="tea-note">
        足を地面につけたまま、植物の根元へ水を注ぎます。観察では少し膝を曲げ、上半身と顔を葉へ近づけます。左利きは菜園も含め反対側から見た見本です。5人の絵は、この動きを確認してから制作します。
      </p>
    </main>
  );
}

type FigureProps = Parameters<typeof GardenFigure>[0];
function Options({
  action,
  setAction,
  left,
  setLeft,
  smooth,
  setSmooth,
  p,
}: {
  action: GardenAction;
  setAction: (action: GardenAction) => void;
  left: boolean;
  setLeft: (left: boolean) => void;
  smooth: boolean;
  setSmooth: (smooth: boolean) => void;
  p: GardenPlayer;
}) {
  return (
    <div className="tea-controls">
      {(["water", "inspect"] as const).map((value) => (
        <button
          key={value}
          aria-pressed={action === value}
          onClick={() => {
            setAction(value);
            p.select(0);
          }}
        >
          {value === "water" ? "水やり" : "植物を見る"}
        </button>
      ))}
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
  const { action, left, smooth } = props;
  return (
    <>
      <div className="tea-live garden-live">
        <GardenFigure {...props} />
      </div>
      <p
        className="garden-phase"
        data-time={Math.round(p.time)}
        data-action={action}
        data-hand={left ? "left" : "right"}
      >
        {gardenLabels[action][Math.floor(gardenPhase(p.time))]} ／{" "}
        {smooth ? "滑らかにつなぐ" : "4コマ表示"}
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
  const { action } = props;
  return (
    <div className="tea-sheet garden-sheet">
      {gardenLabels[action].map((label, i) => (
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
