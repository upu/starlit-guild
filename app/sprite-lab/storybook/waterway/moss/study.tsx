"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { mossRemovalAssets as assets, mossRemovalLayout } from "@/lib/road-moss-removal-layout";
import { waterwayBackgrounds } from "@/lib/road-waterway-layout";

type Layout = ReturnType<typeof mossRemovalLayout>;
const labels = ["木べらを持つ", "葉の下へ入れる", "薄く剥がす", "小さな塊を持ち上げる"];

function useMossStudy() {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(936),
    [frame, setFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
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
  useEffect(() => {
    if (!playing) return;
    let phase = 0;
    const timer = setInterval(() => {
      setFrame([1, 2, 3, 2][phase++ % 4]);
    }, 650);
    return () => {
      clearInterval(timer);
    };
  }, [playing]);
  return {
    root,
    frame,
    setFrame,
    playing,
    setPlaying,
    layout: mossRemovalLayout(width, (width * 2) / 3),
  };
}

export function MossContactStudy() {
  const { root, frame, setFrame, playing, setPlaying, layout } = useMossStudy();
  return (
    <>
      <div className="storybook-study-controls">
        {labels.map((label, index) => (
          <button
            key={label}
            aria-pressed={frame === index}
            onClick={() => {
              setPlaying(false);
              setFrame(index);
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setPlaying(!playing);
          }}
        >
          {playing ? "一時停止" : "再生"}
        </button>
      </div>
      <div
        ref={root}
        className="waterway-layout-stage"
        aria-label="木べらで苔を薄く剥がす接点の見本"
      >
        <MossBackground layout={layout} />
        <MossFigures layout={layout} frame={frame} />
      </div>
      <p role="status">{labels[frame]}</p>
      <p>
        現在は剥がす部分の接点確認です。蓋の開閉・籠への移し替え・運び出しと本編への接続は続けて実装します。
      </p>
    </>
  );
}

function MossBackground({ layout }: { layout: Layout }) {
  return (
    <>
      <div
        className="waterway-layout-background"
        style={{
          backgroundImage: `url(${waterwayBackgrounds.open})`,
          width: layout.backdrop.width,
          height: layout.backdrop.height,
          left: layout.backdrop.x,
          top: layout.backdrop.y,
        }}
      />
      <div
        className="waterway-moss-prop"
        style={{
          backgroundImage: `url(${assets.moss})`,
          width: layout.moss.width,
          height: layout.moss.width * 0.48,
          left: layout.moss.x - layout.moss.width / 2,
          top: layout.moss.y - layout.moss.width * 0.24,
        }}
      />
    </>
  );
}

function MossFigures({ layout, frame }: { layout: Layout; frame: number }) {
  const scale = layout.figureScale;
  const sprite = (
    asset: string,
    point: { x: number; y: number },
    cell: number,
    pose: number,
  ): CSSProperties => ({
    width: cell * scale,
    height: 192 * scale,
    left: point.x - 96 * scale,
    top: point.y - 176 * scale,
    backgroundImage: `url(${asset})`,
    backgroundSize: "400% 100%",
    backgroundPosition: `${String((pose * 100) / 3)}% 0%`,
  });
  return (
    <>
      <div
        role="img"
        aria-label="アリア"
        className="waterway-layout-actor"
        style={sprite(assets.aria, layout.aria, 256, frame)}
      />
      <div
        role="img"
        aria-label="レオン"
        className="waterway-layout-actor"
        style={{
          ...sprite(assets.leon, layout.leon, 192, 1),
          transform: "scaleX(-1)",
          transformOrigin: "50% 50%",
        }}
      />
      <div
        role="img"
        aria-label="受け止める籠"
        className="waterway-moss-prop"
        style={{
          backgroundImage: `url(${assets.basket})`,
          width: 58 * scale,
          height: 38 * scale,
          left: layout.basket.x - 29 * scale,
          top: layout.basket.y - 38 * scale,
        }}
      />
    </>
  );
}
