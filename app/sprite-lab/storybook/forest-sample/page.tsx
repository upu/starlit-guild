"use client";
import { useMemo, useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "./review.css";

/** Read-only positioning review; it does not use or change a game save. */
export default function ForestSampleReview() {
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(0);
  const cue = useMemo(() => studyCue("forest-wetland-return", line, true), [line]);
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>1-6 苔の移し替え</h1>
      <label>
        動作{" "}
        <select
          aria-label="動作"
          value={line}
          onChange={(event) => {
            setLine(Number(event.target.value));
            setTime(0);
          }}
        >
          <option value={0}>瓶から器へ</option>
          <option value={4}>森の苔から器へ</option>
        </select>
      </label>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="9000"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>苔を器へ移す動きの確認用です。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage
          key={line}
          storyId="forest-wetland-return"
          line={line}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
