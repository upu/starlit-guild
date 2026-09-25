import type { StoryLine } from "./stories.ts";

export type BanterExchange = {
  lines: StoryLine[];
  index: number;
  history: StoryLine[];
  turn: number;
  shown: string[];
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
  };
}

function unseen(exchange: BanterExchange, lines: StoryLine[]) {
  return lines.length > 0 && !exchange.shown.includes(banterKey(lines));
}

export function hasNextBanter(exchange: BanterExchange, lines: StoryLine[]) {
  return exchange.index + 1 < exchange.lines.length || unseen(exchange, lines);
}

// Finish the current exchange, then start the latest one only if it has not been shown yet.
export function nextBanter(current: BanterExchange, latest: StoryLine[]): BanterExchange {
  const continuing = current.index + 1 < current.lines.length;
  if (!continuing && !unseen(current, latest)) return current;
  const lines = continuing ? current.lines : latest,
    index = continuing ? current.index + 1 : 0;
  return {
    lines,
    index,
    history: [...current.history, lines[index]].slice(-100),
    turn: current.turn + 1,
    shown: continuing ? current.shown : [...current.shown, banterKey(latest)],
  };
}
