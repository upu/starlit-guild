"use client";
import { useEffect, useMemo, useState } from "react";
import type { Story } from "@/lib/stories";
import type { StoryStageCue } from "@/lib/story-stage";
import { storyArtAt } from "@/lib/story-art";
import {
  nextStageBackground,
  nextStoryArtwork,
  castImageFailures,
  preloadStoryImage,
  stageBackground,
  storyCastImages,
  storyImageReady,
  type CastFallback,
} from "@/lib/storybook/stage-images";

export function useStoryStageImages(
  story: Story,
  page: number,
  cue?: StoryStageCue | false | null,
): { status: "loading" | "ready" | "failed"; castFallback: CastFallback } {
  const stage = stageBackground(story.id, page, cue);
  const src = stage ?? storyArtAt(story.id, page)?.src;
  const painted = !!stage;
  const key = useMemo(() => ({ src }), [src]);
  const next = useMemo(() => nextStageBackground(story, page, stage), [story, page, stage]);
  const nextArtwork = useMemo(() => nextStoryArtwork(story, page), [story, page]);
  const cast = useMemo(() => storyCastImages(story), [story]);
  const [result, setResult] = useState<{ key: typeof key; ok: boolean }>();
  const [castResult, setCastResult] = useState<{ cast: string[]; fallback: CastFallback }>();
  useEffect(() => {
    if (!painted) return;
    let active = true;
    void Promise.all(cast.map(preloadStoryImage)).then((results) => {
      if (active) setCastResult({ cast, fallback: castImageFailures(cast, results) });
    });
    return () => {
      active = false;
    };
  }, [cast, painted]);
  useEffect(() => {
    let active = true;
    if (src)
      void preloadStoryImage(src).then((ok) => {
        if (active) setResult({ key, ok });
      });
    if (next) void preloadStoryImage(next);
    if (nextArtwork) void preloadStoryImage(nextArtwork);
    return () => {
      active = false;
    };
  }, [src, next, nextArtwork, key]);
  const castFallback = castResult?.cast === cast ? castResult.fallback : {};
  if (!src) return { status: "ready", castFallback };
  if (painted && castResult?.cast !== cast && !cast.every(storyImageReady))
    return { status: "loading", castFallback };
  if (storyImageReady(src)) return { status: "ready", castFallback };
  if (result?.key === key) return { status: result.ok ? "ready" : "failed", castFallback };
  return { status: "loading", castFallback };
}
