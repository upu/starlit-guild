"use client";
import { useState } from "react";
import {
  residentIds,
  residentNames,
  residentHand,
  gardenFrame,
  type ResidentId,
} from "@/lib/home-actor";
import { gardenLabels, gardenStudy } from "@/lib/home-garden-study";
import { gardenPlantings, gardenRoot, gardenWater, gardenWetness } from "@/lib/home-garden-water";
import { gardenOffset } from "@/lib/home-room-presentation";
function Sprite({ id, frame }: { id: ResidentId; frame: number }) {
  return (
    <span
      role="img"
      aria-label={`${residentNames[id]}の水やり ${String(frame + 1)}`}
      className="garden-resident-sprite"
      data-frame={frame}
      style={{
        backgroundImage: `url(/home-pixel/${id}-garden.webp)`,
        backgroundPosition: `${String((frame * 100) / 3)}% 0`,
      }}
    />
  );
}
function Scene({ id, time, still }: { id: ResidentId; time: number; still: boolean }) {
  const left = residentHand(id) === "left",
    offset = gardenOffset(id),
    foot = (left ? 168 : 56) + offset.x,
    plants = gardenPlantings(
      { id: "sample", kind: "plot", x: (left ? 60 : 68) / 24, y: 54 / 24 },
      0,
      "linde",
    ),
    root = gardenRoot(plants, id),
    streams = gardenWater(id, time, { x: root.x - foot, y: root.y - 90 - offset.y }, still);
  return (
    <div className="garden-resident-scene" data-left={left}>
      <span className="garden-resident-plot" style={{ left: left ? 60 : 68 }} />
      {plants.map((plant, i) => (
        <span
          key={i}
          className="garden-resident-crop"
          style={{ left: plant.x - plant.width / 2, bottom: 112 - plant.y, width: plant.width }}
        />
      ))}
      <div className="garden-resident-person" style={{ left: foot - 32, bottom: 18 - offset.y }}>
        <Sprite id={id} frame={gardenFrame(time, still)} />
      </div>
      <svg viewBox="0 0 224 112" aria-hidden="true" className="garden-resident-water">
        <ellipse
          data-root="true"
          cx={root.x}
          cy={root.y + 1}
          rx="3"
          ry="1"
          fill="#324e40"
          opacity={gardenWetness(time, still) * 0.6}
        />
        {streams.map((stream, i) => (
          <polyline
            data-stream="true"
            key={i}
            points={stream.points.map((p) => [foot + p.x, 90 + offset.y + p.y].join(",")).join(" ")}
            fill="none"
            stroke="#b6e3ee"
            strokeWidth="0.45"
            strokeOpacity={stream.alpha}
          />
        ))}
        {streams.length > 0 && (
          <path
            data-splash="true"
            d={`M${String(root.x - 1.5)} ${String(root.y - 0.5)}h1 M${String(root.x + 1)} ${String(root.y - 1)}h1`}
            stroke="#b6e3ee"
          />
        )}
      </svg>
    </div>
  );
}
export default function GardenResidents({
  time,
  still,
  select,
}: {
  time: number;
  still: boolean;
  select: (time: number) => void;
}) {
  const [id, setId] = useState<ResidentId>("leon");
  const frame = gardenFrame(time, still);
  return (
    <section className="garden-residents" aria-label="仲間の水やり">
      <h2>仲間の水やり</h2>
      <p>リコは左手、ほかの4人は右手。注ぐ姿勢のときだけ水が出ます。</p>
      <div className="tea-controls">
        {residentIds.map((r) => (
          <button
            key={r}
            aria-pressed={r === id}
            onClick={() => {
              setId(r);
            }}
          >
            {residentNames[r]}
          </button>
        ))}
      </div>
      <div className="garden-resident-live" data-resident={id} data-hand={residentHand(id)}>
        <div className="garden-resident-large">
          <Scene id={id} time={time} still={still} />
        </div>
        <Scene id={id} time={time} still={still} />
      </div>
      <p className="tea-note">
        拡大とゲーム内の大きさ。旅団と同じ画像・水滴・4コマを使います。補間は無地の見本のみです。
      </p>
      <div className="tea-resident-sheet garden-resident-sheet">
        {gardenLabels.map((label, i) => (
          <button
            key={label}
            aria-pressed={frame === i}
            onClick={() => {
              select(i * gardenStudy.step);
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
