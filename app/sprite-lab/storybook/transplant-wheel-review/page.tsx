"use client";
import { useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

export default function TransplantWheelReview() {
  const [time, setTime] = useState(0);
  const [cue] = useState(() => {
    const id = "moss-transplant-departure";
    const previous = studyCue(id, 36, true);
    const current = studyCue(id, 37, true);
    if (!previous || !current) return null;
    const actors = previous.sequence?.at(-1)?.actors ?? previous.actors;
    return {
      ...current,
      initial: Object.fromEntries(actors.map((actor) => [actor.id, actor.x])),
      initialBottom: Object.fromEntries(actors.map((actor) => [actor.id, actor.bottom ?? 14])),
    };
  });
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>4-9 車輪を戻す</h1>
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
      <p>板を敷き、車輪を戻して出発する動きを確認します。セーブは変更しません。</p>
      <div className="forest-sample-preview">
        <StorybookStage
          storyId="moss-transplant-departure"
          line={37}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
