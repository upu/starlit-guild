"use client";
import { useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

export default function HomewardPickupReview() {
  const [time, setTime] = useState(0);
  const [cue] = useState(() => studyCue("medicine-road-home-departure", 0, true));
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>2-9 薬箱を持ち上げる</h1>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="3000"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>薬箱とミラの手、姿勢の切り替えを確認します。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage
          storyId="medicine-road-home-departure"
          line={0}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
