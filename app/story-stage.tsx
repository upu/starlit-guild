"use client";
import { residentNames } from "@/lib/home-actor";
import { stageEntrance, type StoryStageCue } from "@/lib/story-stage";
import { useStoryStageMotion } from "./story-stage-motion";
import { StoryStageProps } from "./story-stage-props";
import { ChapterStageProps } from "./story-stage-chapter-props";
import { StoryStageArrows } from "./story-stage-arrows";
import { useMemo, type CSSProperties } from "react";
import { stageCameraCue } from "@/lib/story-stage-camera";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import type { CastFallback } from "@/lib/storybook/stage-images";

function stageStyle(cue: StoryStageCue): CSSProperties {
  return {
    "--stage-background": `url(/story-stage/${cue.background ?? "meeting-path"}.webp)`,
    "--cart-art": `url(/story-stage/${cue.cartArt ?? "loaded-cart"}.webp)`,
    "--party-cell": `${String(cue.cell ?? 24)}cqw`,
    "--stage-camera-scale": cue.cameraScale ?? RPG_CAMERA_SCALE,
    "--stage-label-scale": RPG_CAMERA_SCALE / (cue.cameraScale ?? RPG_CAMERA_SCALE),
  } as CSSProperties;
}
const actorStyle = (cue: StoryStageCue, actor: StoryStageCue["actors"][number]) => ({
  left: `${String(stageEntrance(actor.id, cue).x)}%`,
  bottom: `${String(actor.bottom ?? 14)}%`,
});
const actorArt = (id: string): CSSProperties =>
  ({
    "--home-art": `url(/home-pixel/${id}.webp)`,
    "--adventure-art": `url(/adventure-pixel/${id}.webp)`,
    "--conversation-art": `url(/story-stage/${id}-poses.webp)`,
  }) as CSSProperties;

function StageActorFigure({
  actor,
  cue,
  speaker,
  castFallback,
}: {
  actor: StoryStageCue["actors"][number];
  cue: StoryStageCue;
  speaker?: string;
  castFallback?: CastFallback;
}) {
  return (
    <div
      className="story-stage-actor"
      data-actor={actor.id}
      data-fallback-standing={!!castFallback?.[actor.id]?.standing}
      data-fallback-walking={!!castFallback?.[actor.id]?.walking}
      data-speaking={speaker === actor.id}
      data-departing={!!cue.cartX}
      style={actorStyle(cue, actor)}
    >
      <span className="story-stage-shadow" />
      <span className="story-stage-sprite" style={actorArt(actor.id)} />
      {actor.id === "aria" && <span className="story-stage-carried-bundle" />}
      <span className="story-stage-reaction" hidden />
      <span className="story-stage-name">{actor.name ?? residentNames[actor.id]}</span>
    </div>
  );
}

type StoryStageProps = {
  cue: StoryStageCue;
  speaker?: string;
  onComplete?: () => void;
  hasten?: boolean;
  /** Internal visual review: render a deterministic point in this cue without playing. */
  previewTime?: number;
  castFallback?: CastFallback;
};

export function StoryStage({
  cue: authoredCue,
  speaker,
  onComplete,
  hasten = false,
  previewTime,
  castFallback,
}: StoryStageProps) {
  const cue = useMemo(() => stageCameraCue(authoredCue), [authoredCue]);
  const stage = useStoryStageMotion(cue, onComplete, hasten, previewTime);
  return (
    <div className="story-art-space story-stage-space">
      <div
        ref={stage}
        className="story-stage"
        role="img"
        aria-label={cue.description}
        data-setting={cue.background ?? "meeting-path"}
        data-cart-art={cue.cartArt ?? "loaded-cart"}
        data-night={!!cue.night}
        style={stageStyle(cue)}
      >
        <div className="story-stage-vignette" aria-hidden="true" />
        <div className="story-stage-ground" aria-hidden="true">
          {cue.background === "tower-base-moss" && <span className="story-stage-wall-moss-light" />}
          {cue.background === "berne-foundation-restored" && (
            <>
              <span className="story-stage-restored-window" />
              <span className="story-stage-restored-stones" />
            </>
          )}
          <div className="story-stage-world">
            <StoryStageProps cue={cue} />
            <ChapterStageProps cue={cue} />
            <StoryStageArrows cue={cue} />
            {cue.actors.map((actor) => (
              <StageActorFigure
                key={actor.id}
                actor={actor}
                cue={cue}
                speaker={speaker}
                castFallback={castFallback}
              />
            ))}
            <div className="story-stage-luggage" aria-hidden="true">
              <span className="story-stage-bundle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
