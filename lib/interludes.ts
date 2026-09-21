import type { State } from "./game.ts";
import { LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import { MEDICINE_RETURN_QUEST } from "./chapter-two-data.ts";

export const interludes = [
  { id: LUNCH_INTERLUDE, after: MEDICINE_RETURN_QUEST, before: BERNE_QUEST },
];
export function interludeUnlocked(s: State, id: string) {
  const entry = interludes.find((item) => item.id === id);
  return !!entry && !!s.done[entry.after] && !!s.story?.read.includes(entry.after + "-return");
}
export const pendingInterlude = (s: State) =>
  interludes.find((item) => interludeUnlocked(s, item.id) && !s.story?.read.includes(item.id));
