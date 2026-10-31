"use client";
import { useMemo, useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

/** Read-only timing review; no game save is used. */
export default function WaterwayMapReview() {
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(3);
  const cue = useMemo(() => studyCue("old-waterway-return", line, true), [line]);
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>1-7 排水口の地図</h1>
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
          <option value={3}>目印と管理人</option>
          <option value={18}>管理図へ記録</option>
        </select>
      </label>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="11000"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>地図・目印・管理人の登場を確認します。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage
          key={line}
          storyId="old-waterway-return"
          line={line}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
