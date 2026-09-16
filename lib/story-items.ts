import { PICNIC_QUEST, MOON_HERB_QUEST } from "./chapter-two.ts";
import type { State } from "./game.ts";
import {
  inPrologue,
  TRADE_QUEST,
  RETURN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
} from "./prologue.ts";

export type StoryItem = { id: string; name: string; description: string; image?: string };
// Derive unique story objects from first readings. Replays and repeat quests never mint copies.
export function storyItems(s: State): StoryItem[] {
  if (!inPrologue(s)) return [];
  const read = (quest: string) => s.story?.read.includes(quest + "-return") ?? !!s.done[quest];
  const items: StoryItem[] = [];
  if (!read(TRADE_QUEST))
    items.push(
      {
        id: "aria-trade",
        name: "アリアの村の交易品",
        description: "村から預かった品。街の取引先へ届ける。",
      },
      {
        id: "leon-trade",
        name: "レオンの村の交易品",
        description: "村から預かった品。街の取引先へ届ける。",
      },
    );
  else if (!read(RETURN_QUEST)) {
    const bought = s.story?.departed.includes(RETURN_QUEST);
    items.push(
      bought
        ? {
            id: "village-purchases",
            name: "村へ持ち帰る品",
            description: "街で買いそろえた頼まれもの。それぞれの村へ届ける。",
          }
        : {
            id: "shopping-list",
            name: "帰りの買い物のメモ",
            description: "村から頼まれた買い物のメモ。交易品を渡したら、街を見て回ろう。",
          },
    );
  }
  if (read(TOWER_QUEST))
    items.push({
      id: "moss-lamp",
      name: "苔灯",
      image: "/items/moss-lamp.png",
      description: read(NIGHT_QUEST)
        ? "塔から持ち帰った小さな灯り。帰り道で光が弱まり、苔の葉の形が見えるようになった。"
        : "塔のそばで分けてもらった光る苔。木の入れ物に寄せると、手元を照らす灯りになった。",
    });
  if (read(WETLAND_QUEST))
    items.push({
      id: "forest-moss",
      name: "森の苔の標本",
      description:
        "森の湿地で少しだけ採った苔。塔の苔と葉の形が似ているが、手元を照らすほどには光らない。",
    });
  items.push(...chapterTwoItems(s));
  return items;
}
function chapterTwoItems(s: State): StoryItem[] {
  const active = (quest: string) =>
    !!s.story?.departed.includes(quest) && !s.story.read.includes(quest + "-return");
  const items: StoryItem[] = [];
  if (active(PICNIC_QUEST))
    items.push({
      id: "picnic-bread",
      name: "二つのパンの包み",
      description: "約束の休日に持ってきたお昼。景色のよい場所で、ふたりで分けよう。",
    });
  if (active(MOON_HERB_QUEST))
    items.push({
      id: "moon-herb-sample",
      name: "ミラの薬草の見本と包み布",
      description: "葉の裏に月の光が残る見本。採った場所ごとに包みを分けて届ける。",
    });
  return items;
}
