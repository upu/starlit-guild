"use client";
import { useState } from "react";
import { residentAnimation, residentIds, residentNames, type ResidentId } from "@/lib/home-actor";
import { WalkFigure } from "./figure";

function Sprite({ id, frame }: { id: ResidentId; frame: number }) {
  const pose = residentAnimation("walk", 0, frame * 3, false);
  return (
    <div
      className="walk-pilot-sprite"
      role="img"
      aria-label={`${residentNames[id]} ${String(frame + 1)} コマ目`}
      style={{
        backgroundImage: `url(/home-pixel/${id}.webp)`,
        backgroundPosition: `${String(((frame % 4) / 3) * 100)}% ${String((Math.floor(frame / 4) / 3) * 100)}%`,
        transform: `translateY(${String((pose.bob / 64) * 100)}%)`,
      }}
    />
  );
}

export function WalkPilot({ frame }: { frame: number }) {
  const [id, setId] = useState<ResidentId>("leon");
  return (
    <section className="walk-pilot">
      <h2>仲間の歩行と比較</h2>
      <p>
        旅団で使う歩行を、見本と同じコマで表示します。衣装で隠れる手や、足を通すタイミングを見比べられます。
      </p>
      <div className="walk-residents" aria-label="比較する仲間">
        {residentIds.map((r) => (
          <button
            key={r}
            aria-pressed={id === r}
            onClick={() => {
              setId(r);
            }}
          >
            <Sprite id={r} frame={frame} />
            <span>{residentNames[r]}</span>
          </button>
        ))}
      </div>
      <div className="walk-pilot-pair" data-resident={id}>
        <div className="walk-large">
          <WalkFigure frame={frame} guides />
        </div>
        <Sprite id={id} frame={frame} />
      </div>
      <p>腕の前後の交代を共通にしています。歩幅や関節の位置には、見本との違いが残ります。</p>
    </section>
  );
}
