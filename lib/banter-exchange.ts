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
// Short-lived battle cues must survive the current exchange finishing.
export function retainBanter(exchange: BanterExchange, lines: StoryLine[]): BanterExchange {
  if (
    !unseen(exchange, lines) ||
    exchange.pending.some((item) => banterKey(item) === banterKey(lines))
  )
    return exchange;
  return { ...exchange, pending: [...exchange.pending, lines] };
}

// Finish the current exchange, then start the latest one only if it has not been shown yet.
export function nextBanter(current: BanterExchange, latest: StoryLine[]): BanterExchange {
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
