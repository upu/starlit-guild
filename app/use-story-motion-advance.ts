import { useRef, useState } from "react";

/** A tap speeds up an ongoing handoff, then advances once it has actually finished. */
export function useStoryMotionAdvance(page: number, required: boolean, advance: () => void) {
  const [completed, setCompleted] = useState<number>();
  const [requested, setRequested] = useState<number>();
  const pending = useRef<number | undefined>(undefined);
  return {
    hasten: required && requested === page && completed !== page,
    advance: () => {
      if (!required || completed === page) {
        advance();
        return;
      }
      pending.current = page;
      setRequested(page);
    },
    finishMotion: () => {
      setCompleted(page);
      if (pending.current !== page) return;
      pending.current = undefined;
      advance();
    },
  };
}
