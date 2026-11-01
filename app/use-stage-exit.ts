import { useEffect, useRef, useState } from "react";

export function stageCompletion(
  playback: ReturnType<typeof useStageExit>,
  waitForMotion: boolean,
  finishMotion: () => void,
) {
  if (playback.exiting) return playback.finishExit;
  return waitForMotion ? finishMotion : undefined;
}

export function useStageExit(
  advancePage: () => void,
  finishing: { current: boolean },
  enabled: boolean,
  fadeOnExit: boolean,
) {
  const [exiting, setExiting] = useState(false);
  const [fading, setFading] = useState(false);
  const exitRequested = useRef(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(fadeTimer.current);
    },
    [],
  );
  const finish = () => {
    advancePage();
    if (!finishing.current) {
      exitRequested.current = false;
      setExiting(false);
      setFading(false);
    }
  };
  return {
    exiting,
    fading,
    advance: () => {
      if (exitRequested.current) return;
      if (enabled) {
        exitRequested.current = true;
        setExiting(true);
      } else advancePage();
    },
    finishExit: () => {
      if (!fadeOnExit || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finish();
        return;
      }
      setFading(true);
      fadeTimer.current = setTimeout(finish, 400);
    },
  };
}
