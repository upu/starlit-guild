"use client";
import { useEffect, useRef, useState } from "react";
import {
  waterwayBackgrounds,
  waterwayLayout,
  type WaterwayPhase,
} from "@/lib/road-waterway-layout";

export function WaterwayLayoutStudy() {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(936);
  const [phase, setPhase] = useState<WaterwayPhase>("blocked");
  const [crouch, setCrouch] = useState(false);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);
  const layout = waterwayLayout(width, (width * 2) / 3);
  return (
    <>
      <div className="storybook-study-controls">
        {(["blocked", "cleared", "open"] as const).map((value, index) => (
          <button
            key={value}
            aria-pressed={phase === value}
            onClick={() => {
              setPhase(value);
            }}
          >
            {["排水前", "排水後", "点検口を開く"][index]}
          </button>
        ))}
        <button
          aria-pressed={crouch}
          onClick={() => {
            setCrouch(!crouch);
          }}
        >
          {crouch ? "立つ" : "しゃがんで縁を調べる"}
        </button>
      </div>
      <div ref={root} className="waterway-layout-stage">
        <div
          className="waterway-layout-background"
          style={{
            backgroundImage: `url(${waterwayBackgrounds[phase]})`,
            width: layout.backdrop.width,
            height: layout.backdrop.height,
            left: layout.backdrop.x,
            top: layout.backdrop.y,
          }}
        />
        <WaterwayFigures layout={layout} crouch={crouch} />
      </div>
      <p>これは足場と縮尺の見本です。道具の受け渡し・作業者・全行程の動きは調整中です。</p>
    </>
  );
}

function WaterwayFigures({
  layout,
  crouch,
}: {
  layout: ReturnType<typeof waterwayLayout>;
  crouch: boolean;
}) {
  const scale = layout.figureScale;
  // Keep soles fixed through the change to the adventure's reaching pose.
  const aria = { x: layout.inspectionHand.x - 45 * scale, y: layout.inspectionHand.y + 10 * scale };
  const leon = layout.project(825, 729);
  return [
    {
      id: "aria",
      label: "アリア",
      foot: aria,
      pose: crouch ? "forage" : "poses",
      frame: crouch ? 2 : 0,
      rows: crouch ? 1 : 2,
    },
    { id: "leon", label: "レオン", foot: leon, pose: "poses", frame: 0, rows: 2 },
  ].map(({ id, label, foot, pose, frame, rows }) => (
    <div
      key={id}
      className="waterway-layout-actor"
      role="img"
      aria-label={label}
      style={{
        width: 192 * scale,
        height: 192 * scale,
        left: foot.x - 96 * scale,
        top: foot.y - 176 * scale,
        backgroundImage: `url(/storybook-study/${id}-${pose}-v1.webp)`,
        backgroundSize: `400% ${String(rows * 100)}%`,
        backgroundPosition: `${String((frame * 100) / 3)}% 0%`,
      }}
    />
  ));
}
