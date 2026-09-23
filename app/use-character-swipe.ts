import { useRef, type TouchEvent } from "react";

const SWIPE_DISTANCE = 50;

export function useCharacterSwipe(
  ids: string[],
  selected: string,
  disabled: boolean,
  onSelect: (id: string) => void,
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    start.current =
      !disabled && event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length !== 1) start.current = null;
  }

  function onTouchEnd(event: TouchEvent) {
    const origin = start.current;
    start.current = null;
    if (disabled || !origin || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy)) return;
    const next = ids.indexOf(selected) + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < ids.length) onSelect(ids[next]);
  }

  function onTouchCancel() {
    start.current = null;
  }

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}
