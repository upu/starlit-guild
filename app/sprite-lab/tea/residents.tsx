"use client";
import { useState } from "react";
import {
  residentIds,
  residentNames,
  residentHand,
  teaFrame,
  type ResidentId,
} from "@/lib/home-actor";
import { teaLabels, teaStudy } from "@/lib/home-tea-study";

function Sprite({ id, frame }: { id: ResidentId; frame: number }) {
  return (
    <span
      role="img"
      aria-label={`${residentNames[id]}のお茶 ${String((frame % 4) + 1)}`}
      className="tea-resident-sprite"
      data-frame={frame}
      style={{
        backgroundImage: `url(/home-pixel/${id}-tea.webp)`,
        backgroundPosition: `${String(((frame % 4) * 100) / 3)}% ${String(Math.floor(frame / 4) * 100)}%`,
      }}
    />
  );
}

export default function TeaResidents({
  time,
  still,
  select,
}: {
  time: number;
  still: boolean;
  select: (time: number) => void;
}) {
  const [id, setId] = useState<ResidentId>("leon");
  const [left, setLeft] = useState(false);
  const frame = teaFrame(time, left, still);
  return (
    <section className="tea-residents" aria-label="仲間のお茶">
      <h2>仲間のお茶</h2>
      <p>斜め向きの4コマ。リコは左手、ほかの4人は右手で持ちます。</p>
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
        <button
          aria-pressed={left}
          onClick={() => {
            setLeft(!left);
          }}
        >
          {left ? "左向き" : "右向き"}
        </button>
      </div>
      <div
        className="tea-resident-live"
        data-resident={id}
        data-hand={residentHand(id)}
        data-left={left}
      >
        <div className="tea-resident-large">
          <Sprite id={id} frame={frame} />
        </div>
        <div>
          <Sprite id={id} frame={frame} />
          <p>ゲーム内の大きさ</p>
        </div>
      </div>
      <Frames id={id} frame={frame} left={left} select={select} />
    </section>
  );
}

function Frames({
  id,
  frame,
  left,
  select,
}: {
  id: ResidentId;
  frame: number;
  left: boolean;
  select: (time: number) => void;
}) {
  return (
    <div className="tea-resident-sheet">
      {teaLabels.map((label, i) => (
        <button
          key={label}
          aria-pressed={frame % 4 === i}
          onClick={() => {
            select(i * teaStudy.step);
          }}
        >
          <Sprite id={id} frame={i + (left ? 4 : 0)} />
          <span>
            {i + 1}. {label}
          </span>
        </button>
      ))}
    </div>
  );
}
