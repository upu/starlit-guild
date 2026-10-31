"use client";
import { useEffect, useState } from "react";

export const frames = [
  ["contact-a-v1", "踏み出しA"],
  ["pass-a-v1", "奥の脚を運ぶ"],
  ["contact-b-v2", "踏み出しB"],
  ["pass-b-v3", "手前の脚を運ぶ"],
] as const;

export function WalkReview() {
  const [character, setCharacter] = useState("leon");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFrame((value) => (value + 1) % frames.length);
    }, 180);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing]);
  return (
    <section className="storybook-walk-review">
      <h3>4コマのつながり（調整中）</h3>
      <p>立ち姿と並べて、通常歩行と荷車運搬の頭身・足運び・手の位置を確認します。</p>
      <label>
        比較する人物と動作
        <select
          value={character}
          onChange={(e) => {
            setCharacter(e.target.value);
          }}
        >
          <option value="leon">レオン</option>
          <option value="aria">アリア</option>
          <option value="aria-push">アリア・荷車を押す</option>
          <option value="leon-pull">レオン・荷車を引く</option>
        </select>
      </label>
      <WalkComparison character={character} frame={frame} />
      <p>
        {frame + 1} / {frames.length}：{frames[frame][1]}
      </p>
      <div className="storybook-study-controls">
        <button
          type="button"
          onClick={() => {
            setPlaying((value) => !value);
          }}
        >
          {playing ? "歩行比較を止める" : "歩行比較を再生"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setFrame((value) => (value + 1) % frames.length);
          }}
        >
          1コマ進める
        </button>
      </div>
    </section>
  );
}

export function WalkFrames({ frame }: { frame: number }) {
  return frames.map(([pose, label], index) => (
    // Keep every frame mounted so switching cannot expose an unloaded image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={pose}
      src={`/storybook-study/leon-${pose}.webp`}
      width="192"
      height="192"
      style={{ visibility: index === frame ? "visible" : "hidden" }}
      alt={`レオン：${label}`}
    />
  ));
}

function WalkComparison({ character, frame }: { character: string; frame: number }) {
  const [id, motion = "walk"] = character.split("-");
  const version = motion === "push" ? "v3" : "v1";
  const label = motion === "push" ? "押す姿勢" : motion === "pull" ? "引く姿勢" : "歩行姿勢";
  return (
    <div className="storybook-walk-pair">
      <figure>
        <div className="storybook-walk-frame">
          <span
            className="storybook-walk-standing"
            role="img"
            aria-label={`${id === "aria" ? "アリア" : "レオン"}の立ち姿`}
            style={{ backgroundImage: `url(/storybook-study/${id}-poses-v1.webp)` }}
          />
        </div>
        <figcaption>立ち姿</figcaption>
      </figure>
      <figure>
        <div className="storybook-walk-frame">
          <span
            className="storybook-walk-standing"
            role="img"
            aria-label={`${id === "aria" ? "アリア" : "レオン"}の${label}`}
            style={{
              backgroundImage: `url(/storybook-study/${id}-${motion}-${version}.webp)`,
              backgroundSize: "400% 100%",
              backgroundPosition: `${String((frame / 3) * 100)}% 0%`,
            }}
          />
        </div>
        <figcaption>{label}</figcaption>
      </figure>
    </div>
  );
}
