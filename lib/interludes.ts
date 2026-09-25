import type { Quest, State } from "./game.ts";
import { LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import { MEDICINE_RETURN_QUEST } from "./chapter-two-data.ts";
import { WALNUT_INTERLUDE, LINDE_REQUESTS_QUEST } from "./chapter-four.ts";
import { BERNE_RESTORATION_QUEST } from "./chapter-three.ts";

export const interludes = [
  { id: LUNCH_INTERLUDE, after: MEDICINE_RETURN_QUEST, before: BERNE_QUEST },
  { id: WALNUT_INTERLUDE, after: BERNE_RESTORATION_QUEST, before: LINDE_REQUESTS_QUEST },
];
export function interludeUnlocked(s: State, id: string) {
  const entry = interludes.find((item) => item.id === id);
  return !!entry && !!s.done[entry.after] && !!s.story?.read.includes(entry.after + "-return");
}
export const pendingInterlude = (s: State) =>
  interludes.find((item) => interludeUnlocked(s, item.id) && !s.story?.read.includes(item.id));
export const isInterlude = (id: string) => interludes.some((item) => item.id === id);
export const interludeQuests: Quest[] = [
  {
    id: LUNCH_INTERLUDE,
    name: "私が用意するお昼",
    region: "幕間 · 休みの日の丘",
    desc: "約束のお昼を、ふたりで。出発すると会話が始まります。一度読むと依頼一覧から消え、手帳の思い出で読み返せます。",
    kind: "護衛",
    tier: 2,
    need: 0,
    seconds: 0,
    gold: 0,
    xp: 0,
    herbs: 0,
    ore: 0,
    enemy: 0,
    availability: "once",
    background: "/scenery/tower-road-background.webp",
  },
  {
    id: WALNUT_INTERLUDE,
    name: "約束の胡桃",
    region: "幕間 · 休みの日の腰掛け",
    desc: "レオンが焼いた胡桃の菓子を、アリアと二人で食べ比べる。読了後に第四章が始まります。",
    kind: "護衛",
    tier: 3,
    need: 0,
    seconds: 0,
    gold: 0,
    xp: 0,
    herbs: 0,
    ore: 0,
    enemy: 0,
    availability: "once",
    background: "/scenery/tower-road-background.webp",
  },
];
