import type { KeyboardEvent, PointerEvent } from "react";

export type StoryGesture = { x: number; y: number; scrollTop: number; moved: boolean };

export function useStoryGestureHandlers(
  dialogue: { current: HTMLDivElement | null },
  gesture: { current: StoryGesture | null },
  advance: () => void,
) {
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      gesture.current = {
        x: event.clientX,
        y: event.clientY,
        scrollTop: dialogue.current?.scrollTop || 0,
        moved: false,
      };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const start = gesture.current;
      if (start && (Math.abs(event.clientX - start.x) > 8 || Math.abs(event.clientY - start.y) > 8))
        start.moved = true;
    },
    onPointerCancel: () => {
      const start = gesture.current;
      if (start) start.moved = true;
    },
    onClick: () => {
      const start = gesture.current;
      gesture.current = null;
      if (
        start &&
        (start.moved || Math.abs((dialogue.current?.scrollTop || 0) - start.scrollTop) > 4)
      )
        return;
      advance();
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        advance();
      }
    },
  };
}
