import { useImperativeHandle, type Ref } from "react";
import type { StoryAdvance } from "./use-story-advance";
export type StageTitle = { number: string; name: string };
export function StageTitleCard({
  stage,
  onStart,
  advanceRef,
}: {
  stage: StageTitle;
  onStart: () => void;
  advanceRef?: Ref<StoryAdvance>;
}) {
  useImperativeHandle(advanceRef, () => ({ advance: onStart }));
  return (
    <div className="story-reader stage-title-reader">
      <button
        type="button"
        className="stage-title-card"
        aria-label={`${stage.number} ${stage.name}：会話を始める`}
        onClick={onStart}
      >
        <span>{stage.number}</span>
        <strong>{stage.name}</strong>
      </button>
    </div>
  );
}
