"use client";
import { useState } from "react";
import { studyCue } from "@/lib/storybook/carry-cue";
import { storybookExitCue } from "@/lib/storybook/travel-packing";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

export default function TransplantExitReview() {
  const [time, setTime] = useState(0);
  const [cue] = useState(() => {
    const id = "moss-transplant-departure";
    const previous = studyCue(id, 37, true)?.sequence?.at(-1);
    const exit = storybookExitCue(id);
    if (!previous || !exit) return null;
    return {
      ...exit,
      initial: Object.fromEntries(previous.actors.map((actor) => [actor.id, actor.x])),
      initialBottom: Object.fromEntries(
        previous.actors.map((actor) => [actor.id, actor.bottom ?? 14]),
      ),
    };
  });
  if (!cue) return null;
  return (
    <main className="storybook-study">
      <h1>4-9 会話後の出発</h1>
      <label>
        舞台の時刻 {time}ms
        <input
          aria-label="舞台の時刻"
          type="range"
          min="0"
          max="6500"
          step="50"
          value={time}
          onChange={(event) => {
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <p>荷車への合流と退出を確認します。セーブは変更しません。</p>
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
