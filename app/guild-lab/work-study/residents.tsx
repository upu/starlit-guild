"use client";
import { useState } from "react";
import {
  residentIds,
  residentNames,
  residentHand,
  workFrame,
  type ResidentId,
} from "@/lib/home-actor";
import { workLabels, workStudy } from "@/lib/home-work-study";
import { workBenchOffset, homeFurnitureScale } from "@/lib/home-room-presentation";

function Sprite({ id, frame }: { id: ResidentId; frame: number }) {
  return (
    <span
      role="img"
      aria-label={`${residentNames[id]}の作業 ${String(frame + 1)}`}
      className="work-resident-sprite"
      data-frame={frame}
      style={{
        backgroundImage: `url(/home-pixel/${id}-work.webp)`,
        backgroundPosition: `${String((frame * 100) / 3)}% 0`,
      }}
    />
  );
}
function Scene({ id, frame }: { id: ResidentId; frame: number }) {
  const offset = workBenchOffset(id),
    width = 72 * homeFurnitureScale;
  return (
    <div className="work-resident-scene" data-left={id === "lico"}>
      <span
        className="work-resident-bench"
        style={{ width, left: 64 - offset.x - width / 2, bottom: 22 + offset.y }}
      />
      <Sprite id={id} frame={frame} />
    </div>
  );
}
export default function WorkResidents({
  time,
  still,
  select,
}: {
  time: number;
  still: boolean;
  select: (time: number) => void;
}) {
  const [id, setId] = useState<ResidentId>("leon");
  const frame = workFrame(time, still);
  return (
    <section className="work-residents" aria-label="仲間の作業">
      <h2>仲間の作業</h2>
      <p>同じ4姿勢を5人へ。リコは左手、ほかの4人は右手を中心に動かします。</p>
      <div className="tea-controls">
        {residentIds.map((resident) => (
          <button
            key={resident}
            aria-pressed={id === resident}
            onClick={() => {
              setId(resident);
            }}
          >
            {residentNames[resident]}
          </button>
        ))}
      </div>
      <div className="work-resident-live" data-resident={id} data-hand={residentHand(id)}>
        <div className="work-resident-large">
          <Scene id={id} frame={frame} />
        </div>
        <Scene id={id} frame={frame} />
      </div>
      <p className="tea-note">
        拡大とゲーム内の大きさ。旅団と同じ画像・時刻で再生します。滑らかな補間は無地の見本だけに適用します。
      </p>
      <div className="tea-resident-sheet work-resident-sheet">
        {workLabels.map((label, i) => (
          <button
            key={label}
            aria-pressed={frame === i}
            onClick={() => {
              select(i * workStudy.step);
            }}
          >
            <Sprite id={id} frame={i} />
            <span>
              {i + 1}. {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
