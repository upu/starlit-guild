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
function Scene({ id, frame, desk }: { id: ResidentId; frame: number; desk: boolean }) {
  const offset = workBenchOffset(id),
    width = 72 * homeFurnitureScale;
  return (
    <div className="work-resident-scene" data-left={id === "lico"}>
      <span
        className="work-resident-bench"
        style={{
          width,
          left: 64 - offset.x - width / 2,
          bottom: 22 + offset.y,
          backgroundImage: `url(/home-pixel/prop-${desk ? "3" : "4"}.webp)`,
        }}
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
  const [desk, setDesk] = useState(false);
  const frame = workFrame(time, still);
  return (
    <section className="work-residents" aria-label="仲間の作業">
      <h2>仲間の作業</h2>
      <p>同じ4姿勢を5人へ。リコは左手、ほかの4人は右手を中心に動かします。</p>
      <Controls id={id} setId={setId} desk={desk} setDesk={setDesk} />
      <div
        className="work-resident-live"
        data-furniture={desk ? "desk" : "bench"}
        data-resident={id}
        data-hand={residentHand(id)}
      >
        <div className="work-resident-large">
          <Scene id={id} frame={frame} desk={desk} />
        </div>
        <Scene id={id} frame={frame} desk={desk} />
      </div>
      <p className="tea-note">
        拡大とゲーム内の大きさ。旅団と同じ画像・時刻で再生します。滑らかな補間は無地の見本だけに適用します。
      </p>
      <Frames id={id} frame={frame} select={select} />
    </section>
  );
}

function Frames({
  id,
  frame,
  select,
}: {
  id: ResidentId;
  frame: number;
  select: (time: number) => void;
}) {
  return (
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
  );
}

function Controls({
  id,
  setId,
  desk,
  setDesk,
}: {
  id: ResidentId;
  setId: (id: ResidentId) => void;
  desk: boolean;
  setDesk: (desk: boolean) => void;
}) {
  return (
    <>
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
      <div className="tea-controls">
        <button
          aria-pressed={!desk}
          onClick={() => {
            setDesk(false);
          }}
        >
          作業台で比較
        </button>
        <button
          aria-pressed={desk}
          onClick={() => {
            setDesk(true);
          }}
        >
          事務机で比較
        </button>
      </div>
    </>
  );
}
