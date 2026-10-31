"use client";
import { useMemo, useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

/** Read-only playback for comparing the handoff at the actual authored timing. */
export default function WorkshopHandoffReview() {
  const [time, setTime] = useState(0);
  const cue = useMemo(() => studyCue("sweet-blockade-return", 0, true), []);
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>2-7 蜜の受け渡し</h1>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="8000"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>矢、包みの回収、ミラへの受け渡しの確認用です。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage storyId="sweet-blockade-return" line={0} cue={cue} previewTime={time} />
      </div>
    </main>
  );
}
