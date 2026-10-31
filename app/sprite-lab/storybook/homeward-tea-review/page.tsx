"use client";
import { useMemo, useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

export default function HomewardTeaReview() {
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(9);
  const cue = useMemo(() => {
    const scene = studyCue("medicine-road-home-return", line, true);
    if (!scene || line !== 9) return scene;
    return {
      ...scene,
      initial: { ...scene.initial, aria: 67, leon: 62, mira: 25 },
      initialBottom: { ...scene.initialBottom, aria: 24, leon: 48, mira: 42 },
    };
  }, [line]);
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>2-9 三人分のお茶</h1>
      <label>
        確認する動き
        <select
          value={line}
          onChange={(event) => {
            setLine(Number(event.target.value));
          }}
        >
          <option value={1}>仕事場に帰着</option>
          <option value={9}>三人分のお茶</option>
        </select>
      </label>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="12000"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>帰着時の荷物とお茶の動きを確認します。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage
          key={line}
          storyId="medicine-road-home-return"
          line={line}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
