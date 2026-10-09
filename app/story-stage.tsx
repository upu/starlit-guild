"use client";
import { residentNames } from "@/lib/home-actor";
import { stageEntrance, type StoryStageCue } from "@/lib/story-stage";
import { useStoryStageMotion } from "./story-stage-motion";

export function StoryStage({ cue, speaker }: { cue: StoryStageCue; speaker?: string }) {
  const stage = useStoryStageMotion(cue);
  return (
    <div className="story-art-space story-stage-space">
      <div ref={stage} className="story-stage" role="img" aria-label={cue.description}>
        <div className="story-stage-vignette" aria-hidden="true" />
        <div className="story-stage-ground" aria-hidden="true">
          {cue.actors.map((actor) => (
            <div
              key={actor.id}
              className="story-stage-actor"
              data-actor={actor.id}
              data-speaking={speaker === actor.id}
              style={{ left: `${String(stageEntrance(actor.id).x)}%` }}
            >
              <span className="story-stage-shadow" />
              <span
                className="story-stage-sprite"
                style={{ backgroundImage: `url(/home-pixel/${actor.id}.webp)` }}
              />
              <span className="story-stage-reaction" hidden />
              <span className="story-stage-name">{residentNames[actor.id]}</span>
            </div>
          ))}
          {cue.luggage && (
            <div className="story-stage-luggage">
              <span className="story-stage-bundle" />
              <span className="story-stage-bundle story-stage-bundle-large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
