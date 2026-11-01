import { useEffect, useRef, useState } from "react";

export const travelDuration = 2880;

export function useWalkTravel() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!running) return;
    const origin = performance.now() - elapsedRef.current;
    let handle = 0;
    const tick = (now: number) => {
      const value = Math.min(travelDuration, now - origin);
      elapsedRef.current = value;
      setElapsed(value);
      if (value === travelDuration) setRunning(false);
      else handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(handle);
    };
  }, [running]);
  const seek = (value: number) => {
    setRunning(false);
    elapsedRef.current = Math.max(0, Math.min(travelDuration, value));
    setElapsed(elapsedRef.current);
  };
  const start = () => {
    if (elapsedRef.current >= travelDuration) {
      elapsedRef.current = 0;
      setElapsed(0);
    }
    setRunning(true);
  };
  return {
    elapsed,
    running,
    seek,
    start,
    pause: () => {
      setRunning(false);
    },
  };
}
