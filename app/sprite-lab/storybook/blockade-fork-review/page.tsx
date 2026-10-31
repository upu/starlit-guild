"use client";
import { useState } from "react";
import { stories } from "@/lib/stories";
import { studyCue } from "@/lib/storybook/carry-cue";
import { StorybookStage } from "../../../storybook/stage";
import "../study.css";
import "../forest-sample/review.css";

/** Inspect individual moments without changing the player's saved progress. */
export default function BlockadeForkReview() {
  const [line, setLine] = useState(17);
  const [time, setTime] = useState(0);
  const [cue, setCue] = useState(() => studyCue("sweet-blockade-return", 17, true));
  const story = stories.find((entry) => entry.id === "sweet-blockade-return");
  if (!story || !cue) return null;
  return (
    <main className="storybook-study">
      <h1>2-7 分かれ道の動き</h1>
      <label>
        会話
        <select
          aria-label="会話"
          value={line}
          style={{ maxWidth: "100%" }}
          onChange={(event) => {
            const next = Number(event.target.value);
            setLine(next);
            setCue(studyCue("sweet-blockade-return", next, true));
            setTime(0);
          }}
        >
          {story.lines.slice(17).map((entry, index) => (
            <option key={index + 17} value={index + 17}>
              {index + 18}：{entry.text.slice(0, 24)}
            </option>
          ))}
        </select>
      </label>
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
      <p>{story.lines[line].text}</p>
      <div className="forest-sample-preview">
        <StorybookStage
          key={line}
          storyId="sweet-blockade-return"
          line={line}
          cue={cue}
          previewTime={time}
        />
      </div>
    </main>
  );
}
