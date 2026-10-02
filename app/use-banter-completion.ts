import { useEffect, useRef } from "react";
import type { BanterExchange } from "@/lib/banter-exchange";

// A final line becomes read only after it has remained visible for its reading time.
export function useBanterCompletion(
  exchange: BanterExchange,
  paused: boolean,
  onComplete?: () => void,
) {
  const complete = useRef(onComplete),
    finished = useRef(false);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  const line = exchange.lines.at(exchange.index),
    last = exchange.index === exchange.lines.length - 1;
  useEffect(() => {
    if (paused || !last || !line || !complete.current || finished.current) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden || finished.current) return;
      timer = setTimeout(
        () => {
          finished.current = true;
          complete.current?.();
        },
        Math.max(3500, line.text.length * 100),
      );
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [paused, last, line]);
}
