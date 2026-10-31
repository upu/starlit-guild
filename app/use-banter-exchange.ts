import { useState } from "react";
import { interruptBanter, retainBanter, startBanter, switchBanter } from "@/lib/banter-exchange";
import type { StoryLine } from "@/lib/stories";

/** Situational dialogue can interrupt a stale line while preserving history. */
export function useBanterExchange(
  lines: StoryLine[],
  retain: boolean,
  context?: string,
  preserveInterrupted = false,
) {
  const [exchange, setExchange] = useState(() => startBanter(lines));
  const [contexts, setContexts] = useState<{ current?: string; progress: Record<string, number> }>({
    current: context,
    progress: {},
  });
  const changed = context !== contexts.current;
  const progress = { ...contexts.progress };
  if (changed && contexts.current && exchange.lines.length)
    progress[contexts.current] = exchange.index + 1;
  const switched =
    changed && context !== undefined
      ? preserveInterrupted
        ? interruptBanter(exchange, lines)
        : switchBanter(exchange, lines, progress[context])
      : exchange;
  const next = retain ? retainBanter(switched, lines) : switched;
  if (changed) setContexts({ current: context, progress });
  if (next !== exchange) setExchange(next);
  return [exchange, setExchange] as const;
}
