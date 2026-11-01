import { useEffect, useRef } from "react";
import { atEndOfBanter, type BanterExchange } from "@/lib/banter-exchange";

// A final line becomes read only after it has remained visible for its reading time.
export function useBanterCompletion(
  exchange: BanterExchange,
  paused: boolean,
  hasNext: boolean,
  minimum: number,
  onComplete?: () => void,
) {
  const complete = useRef(onComplete),
    finished = useRef(false);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  const line = exchange.lines.length ? exchange.history.at(-1) : undefined,
    last = atEndOfBanter(exchange);
  useEffect(() => {
    if (paused || hasNext || !last || !complete.current || finished.current) return;
    if (!line) {
      finished.current = true;
      complete.current();
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden || finished.current) return;
      timer = setTimeout(
        () => {
          finished.current = true;
          complete.current?.();
        },
        Math.max(3500, line.text.length * 100, minimum),
      );
    };
    schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [paused, hasNext, last, line, minimum, onComplete]);
}
