"use client";
import { useState } from "react";
import {
  adventureHeroArt,
  adventureHeroAsset,
  adventureHeroIds,
  adventureHeroFrames,
} from "@/lib/adventure-hero-art";
import { useStudyPlayer } from "../study-player";
import EnemyStudy from "./enemies";

const actions = [
  { label: "歩く", start: 0, count: 8, step: 90 },
  { label: "待機・まばたき", start: 8, count: 2, step: 3450 },
  { label: "攻撃", start: adventureHeroFrames.attack, count: 4, step: 162.5 },
  { label: "採集", start: adventureHeroFrames.gather, count: 2, step: 220 },
  { label: "被弾", start: adventureHeroFrames.hurt, count: 2, step: 160 },
  { label: "荷車を押す", start: adventureHeroFrames.push, count: 2, step: 220 },
  { label: "荷車を引く", start: adventureHeroFrames.pull, count: 2, step: 220 },
  { label: "荷詰め", start: adventureHeroFrames.pack, count: 2, step: 750 },
];
const names = { aria: "アリア", leon: "レオン", mira: "ミラ", finn: "フィン", lico: "リコ" };

function MotionChoice({ action, select }: { action: number; select: (value: number) => void }) {
  return (
    <label>
      動作{" "}
      <select
        aria-label="動作"
        value={action}
        onChange={(e) => {
          select(Number(e.target.value));
        }}
      >
        {actions.map((a, i) => (
          <option key={a.label} value={i}>
            {a.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Playback({
  player,
  next,
}: {
  player: ReturnType<typeof useStudyPlayer>;
  next: () => void;
}) {
  return (
    <>
      <button
        onClick={() => {
          player.setPlaying(!player.playing);
        }}
        disabled={player.still}
      >
        {player.playing ? "一時停止" : "再生"}
      </button>
      <button onClick={next}>次のコマ</button>
      <label>
        <input
          type="checkbox"
          checked={player.slow}
          onChange={(e) => {
            player.setSlow(e.target.checked);
          }}
        />
        ゆっくり
      </label>
      <label>
        <input
          type="checkbox"
          checked={player.still}
          onChange={(e) => {
            player.reduce(e.target.checked);
          }}
        />
        動きを減らす
      </label>
    </>
  );
}

function Figures({ frame, zoom }: { frame: number; zoom: number }) {
  const cell = adventureHeroArt.cell * 0.5 * zoom;
  return (
    <div className="adventure-study-figures">
      {adventureHeroIds.map((id) => (
        <figure key={id}>
          <div className="adventure-study-floor">
            <div
              role="img"
              aria-label={`${names[id]}の動作`}
              data-frame={frame}
              style={{
                width: cell,
                height: cell,
                backgroundImage: `url(${adventureHeroAsset(id)})`,
                backgroundSize: `${String(cell * 4)}px ${String(cell * 6)}px`,
                backgroundPosition: `${String(-(frame % 4) * cell)}px ${String(-Math.floor(frame / 4) * cell)}px`,
              }}
            />
          </div>
          <figcaption>{names[id]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export default function AdventureStudy() {
  const [action, setAction] = useState(0);
  const [zoom, setZoom] = useState(1);
  const selected = actions[action];
  const player = useStudyPlayer(action === 1 ? 3600 : selected.count * selected.step);
  const index = Math.min(selected.count - 1, Math.floor(player.time / selected.step));
  const frame = selected.start + (player.still ? 0 : index);
  return (
    <main className="adventure-study">
      <h1>冒険のミニキャラ・動きの見本</h1>
      <p>5人を並べて、歩行・戦闘・作業の動きを確認できます。通常表示は立ち姿48pxです。</p>
      <div className="adventure-study-controls">
        <MotionChoice
          action={action}
          select={(value) => {
            setAction(value);
            player.select(0);
          }}
        />
        <Playback
          player={player}
          next={() => {
            player.select(((index + 1) % selected.count) * selected.step);
          }}
        />
        <label>
          大きさ{" "}
          <select
            value={zoom}
            onChange={(e) => {
              setZoom(Number(e.target.value));
            }}
          >
            <option value={1}>通常</option>
            <option value={2}>2倍</option>
            <option value={3}>3倍</option>
          </select>
        </label>
      </div>
      <Figures frame={frame} zoom={zoom} />
      <label className="adventure-study-timeline">
        コマ {index + 1} / {selected.count}
        <input
          aria-label="コマを選ぶ"
          type="range"
          min={0}
          max={selected.count - 1}
          value={index}
          onChange={(e) => {
            player.select(Number(e.target.value) * selected.step);
          }}
        />
      </label>
      <EnemyStudy zoom={zoom} />
      <p>
        歩行・待機はホームと共通の素材です。攻撃と被弾は確認用に繰り返します。ゲームのセーブには触れません。
      </p>
    </main>
  );
}
