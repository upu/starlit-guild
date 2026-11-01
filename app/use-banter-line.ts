import { useEffect, useRef } from "react";
import type { StoryLine } from "@/lib/stories";
import type { BanterExchange } from "@/lib/banter-exchange";

export function useCurrentBanterLine(
  exchange: BanterExchange,
  onCurrentLine?: (line: StoryLine | undefined) => void,
) {
  const line = exchange.lines.length ? exchange.history.at(-1) : undefined;
  useEffect(() => {
    onCurrentLine?.(line);
  }, [line, onCurrentLine]);
  return line;
}

export function useLatestBanter(lines: StoryLine[]) {
  const latest = useRef(lines);
  useEffect(() => {
    latest.current = lines;
  }, [lines]);
  return latest;
}

export function useBanterLineFilter(filter?: (line: StoryLine, history: StoryLine[]) => boolean) {
  const latest = useRef(filter);
  useEffect(() => {
    latest.current = filter;
  }, [filter]);
  return latest;
}
