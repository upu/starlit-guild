"use client";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { StoryStage } from "../../story-stage";
import { studyScenes, studyStories } from "./scenes";
import type { Story } from "@/lib/stories";
import type { StoryStageCue } from "@/lib/story-stage";
import { AdventureStudy } from "./adventure";
import { CharacterStudy } from "./characters";
import "../../storybook/conversation-actors.css";
import "../../storybook/reactions.css";
import "../../storybook/packing.css";
import "../../storybook/night.css";
import "../../storybook/finn-actors.css";
import "../../storybook/mira-actors.css";
import "../../storybook/lico-actors.css";
import "../../storybook/office-extras.css";
import "../../storybook/merchant-placement.css";
import { studyCue } from "@/lib/storybook/carry-cue";
import { LineReview } from "./line-review";
import "../../storybook/stage-art.css";
import { storybookStageAttributes } from "@/lib/storybook/presentation";

function Introduction() {
  return (
    <header>
      <h1>絵本調の舞台見本</h1>
      <p>
        屋外の荷物運び、屋内の会話・着座・紙の受け渡し、冒険の歩行と荷物運びを確認できます。動作のつながりと描画の統一は調整中です。
      </p>
    </header>
  );
}

export default function Study() {
  const [sceneId, setSceneId] = useState("outdoor");
  const scene = studyScenes.find((s) => s.id === sceneId) ?? studyScenes[0];
  const story = studyStories.find((s) => s.id === scene.storyId);
  return (
    <main className="storybook-study storybook-presentation" data-mode={sceneId}>
      <Introduction />
      <label>
        場面{" "}
        <select
          value={sceneId}
          onChange={(e) => {
            setSceneId(e.target.value);
          }}
        >
          {studyScenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          <option value="adventure">冒険・倉庫前</option>
          <option value="characters">人物・姿勢比較</option>
        </select>
      </label>
      {sceneId === "characters" ? (
        <CharacterStudy />
      ) : sceneId === "adventure" ? (
        <AdventureStudy />
      ) : (
        story && <Conversation key={sceneId} story={story} end={scene.end} art={scene.art} />
      )}
      <p>人物・小物の描画統一は制作中です。</p>
    </main>
  );
}

function Conversation({ story, end, art }: { story: Story; end: number; art: string }) {
  const [line, setLine] = useState(0);
  const [painted, setPainted] = useState(true);
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const complete = useCallback((finished = true) => {
    setReady(finished);
  }, []);
  const cue = useMemo(() => studyCue(story.id, line, painted), [story.id, line, painted]);
  if (!cue) return null;
  return (
    <div
      className="storybook-conversation"
      style={{ "--study-background": `url(/storybook-study/${art}.png)` } as CSSProperties}
    >
      <BackgroundChoice painted={painted} change={setPainted} />
      <LineReview line={line} end={end} change={setLine} ready={setReady} />
      <section
        className="storybook-preview storybook-painted-stage"
        {...storybookStageAttributes(story.id, line, painted)}
      >
        <StudyStage
          key={replay}
          cue={cue}
          speaker={story.lines[line].speaker}
          complete={complete}
        />
        <div className="storybook-dialogue" aria-live="polite">
          <p>{story.lines[line].text}</p>
          <div>
            <span>
              {line + 1} / {end}
            </span>
            <button
              onClick={() => {
                setLine(0);
                setReplay(replay + 1);
                setReady(false);
              }}
            >
              最初から
            </button>
            <button
              disabled={!!cue.finishBeforeAdvance && !ready}
              onClick={() => {
                setLine((line + 1) % end);
                setReady(false);
              }}
            >
              次へ
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StudyStage({
  cue,
  speaker,
  complete,
}: {
  cue: StoryStageCue;
  speaker: Story["lines"][number]["speaker"];
  complete: (finished?: boolean) => void;
}) {
  const [review, setReview] = useState<{ cue: StoryStageCue; time: number }>();
  const previewTime = review?.cue === cue ? review.time : undefined;
  const reviewEnd = Math.max(4000, ...(cue.sequence ?? []).map((moment) => moment.after + 4000));
  return (
    <div className="storybook-stage-viewport">
      <details className="storybook-motion-review">
        <summary>動作の途中を確認</summary>
        <label>
          時刻 {previewTime ?? "再生中"}
          <input
            aria-label="舞台の時刻"
            type="range"
            min="0"
            max={reviewEnd}
            step="50"
            value={previewTime ?? 0}
            onChange={(e) => {
              complete(false);
              setReview({ cue, time: Number(e.target.value) });
            }}
          />
        </label>
        <button
          disabled={previewTime === undefined}
          onClick={() => {
            complete(false);
            setReview(undefined);
          }}
        >
          通常再生へ戻す
        </button>
      </details>
      <StoryStage cue={cue} speaker={speaker} onComplete={complete} previewTime={previewTime} />
    </div>
  );
}

function BackgroundChoice({
  painted,
  change,
}: {
  painted: boolean;
  change: (value: boolean) => void;
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={painted}
        onChange={(e) => {
          change(e.target.checked);
        }}
      />
      背景・会話姿勢・小物の試作を表示
    </label>
  );
}
