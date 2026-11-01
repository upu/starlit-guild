import type { StoryLine } from "./stories.ts";

export type BanterExchange = {
  lines: StoryLine[];
  index: number;
  history: StoryLine[];
  turn: number;
  shown: string[];
  pending: StoryLine[][];
};

// Expression changes alone do not make a line new to the reader.
function banterKey(lines: StoryLine[]) {
  return JSON.stringify(lines.map((line) => [line.speaker || "", line.text]));
}

export function startBanter(lines: StoryLine[]): BanterExchange {
  return {
    lines,
    index: 0,
    history: lines.slice(0, 1),
    turn: 0,
    shown: lines.length ? [banterKey(lines)] : [],
    pending: [],
  };
}

function unseen(exchange: BanterExchange, lines: StoryLine[]) {
  return lines.length > 0 && !exchange.shown.includes(banterKey(lines));
}

export function hasNextBanter(exchange: BanterExchange, lines: StoryLine[]) {
  return (
    exchange.index + 1 < exchange.lines.length ||
    exchange.pending.length > 0 ||
    unseen(exchange, lines)
  );
}
export const atEndOfBanter = (exchange: BanterExchange) =>
  exchange.lines.length === 0 || exchange.index === exchange.lines.length - 1;
// Short-lived battle cues must survive the current exchange finishing.
export function retainBanter(exchange: BanterExchange, lines: StoryLine[]): BanterExchange {
  if (
    !unseen(exchange, lines) ||
    exchange.pending.some((item) => banterKey(item) === banterKey(lines))
  )
    return exchange;
  return { ...exchange, pending: [...exchange.pending, lines] };
}

/** Replace an expired situational exchange without discarding the readable history. */
export function switchBanter(
  exchange: BanterExchange,
  lines: StoryLine[],
  resume = 0,
): BanterExchange {
  if (!lines.length) return exchange;
  if (resume >= lines.length)
    return exchange.lines.length ? { ...exchange, lines: [], index: 0, pending: [] } : exchange;
  if (banterKey(exchange.lines) === banterKey(lines)) return exchange;
  const key = banterKey(lines);
  const index = Math.max(0, Math.min(lines.length - 1, resume));
  return {
    lines,
    index,
    history: [...exchange.history, lines[index]].slice(-100),
    turn: exchange.turn + 1,
    shown: exchange.shown.includes(key) ? exchange.shown : [...exchange.shown, key],
    pending: [],
  };
}

/** Put interrupted lines in the transcript before the new time-sensitive cue. */
export function interruptBanter(exchange: BanterExchange, lines: StoryLine[]): BanterExchange {
  const remaining = exchange.lines.slice(exchange.index + 1);
  const switched = switchBanter(exchange, lines);
  if (switched === exchange) return exchange;
  return {
    ...switched,
    history: [
      ...exchange.history,
      ...remaining,
      ...exchange.pending.flat(),
      switched.lines[switched.index],
    ].slice(-100),
    shown: [...new Set([...switched.shown, ...exchange.pending.map(banterKey)])],
    pending: [],
  };
}

// Finish the current exchange, then start the latest one only if it has not been shown yet.
function advanceBanter(current: BanterExchange, latest: StoryLine[]): BanterExchange {
  const continuing = current.index + 1 < current.lines.length;
  const queued = current.pending.at(0);
  if (!continuing && !queued && !unseen(current, latest)) return current;
  const lines = continuing ? current.lines : queued || latest,
    index = continuing ? current.index + 1 : 0;
  return {
    lines,
    index,
    history: [...current.history, lines[index]].slice(-100),
    turn: current.turn + 1,
    shown: continuing ? current.shown : [...current.shown, banterKey(lines)],
    pending: !continuing && queued ? current.pending.slice(1) : current.pending,
  };
}

/** Decide eligibility at display time, including lines retained from an earlier state. */
export function nextBanter(
  current: BanterExchange,
  latest: StoryLine[],
  canShow?: (line: StoryLine, history: StoryLine[]) => boolean,
): BanterExchange {
  let next = current;
  for (;;) {
    const advanced = advanceBanter(next, latest);
    if (advanced === next) return next;
    const line = advanced.lines[advanced.index];
    if (!canShow || canShow(line, next.history)) return advanced;
    // Keep the canonical sequence and its shown keys, but do not record a line
    // that the player never saw or allow it to trigger a visual cue.
    next = { ...advanced, history: next.history, turn: next.turn };
  }
}
