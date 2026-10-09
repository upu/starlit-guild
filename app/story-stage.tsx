"use client";
import { residentNames } from "@/lib/home-actor";
import { stageEntrance, type StoryStageCue } from "@/lib/story-stage";
import { useStoryStageMotion } from "./story-stage-motion";
import type { CSSProperties } from "react";

export function StoryStage({ cue, speaker }: { cue: StoryStageCue; speaker?: string }) {
  const stage = useStoryStageMotion(cue);
  return (
    <div className="story-art-space story-stage-space">
      <div ref={stage} className="story-stage" role="img" aria-label={cue.description}>
        <div className="story-stage-vignette" aria-hidden="true" />
        <div className="story-stage-ground" aria-hidden="true">
          <span className="story-stage-cart" />
          {cue.actors.map((actor) => (
            <div
              key={actor.id}
              className="story-stage-actor"
              data-actor={actor.id}
              data-speaking={speaker === actor.id}
              data-departing={!!cue.cartX}
              style={{ left: `${String(stageEntrance(actor.id).x)}%` }}
            >
              <span className="story-stage-shadow" />
              <span
                className="story-stage-sprite"
                style={
                  {
                    "--home-art": `url(/home-pixel/${actor.id}.webp)`,
                    "--adventure-art": `url(/adventure-pixel/${actor.id}.webp)`,
                  } as CSSProperties
                }
              />
              {actor.id === "aria" && !cue.luggage && cue.cartX && (
                <span className="story-stage-carried-bundle" />
              )}
              <span className="story-stage-reaction" hidden />
              <span className="story-stage-name">{residentNames[actor.id]}</span>
            </div>
          ))}
          {cue.luggage && (
            <div className="story-stage-luggage">
              <span className="story-stage-bundle" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
