import { BERNE_QUEST, STONE_RETURN_QUEST, BERNE_RESTORATION_QUEST } from "./chapter-three.ts";
import { MOSS_TRAIL_QUEST, MERRILL_SEEDLINGS_QUEST, GUILD_FOUNDING_QUEST } from "./chapter-four.ts";
export type StoryArt = {
  src: string;
  videoSrc?: string;
  alt: string;
  width: number;
  height: number;
  revealAtLine: number;
};

// Reveal illustrations with the scene, rather than previewing later events.
export const storyArt: Partial<Record<string, StoryArt>> = {
  [MOSS_TRAIL_QUEST + "-departure"]: {
    src: "/stories/mira-after-all-nighter.webp",
    alt: "徹夜明けのミラを、フィンとアリアが宿の広間で心配する。",
    width: 1536,
    height: 1024,
    revealAtLine: 4,
  },
  [MOSS_TRAIL_QUEST + "-return"]: {
    src: "/stories/blue-cloth-alley.webp",
    alt: "青い布の陰でアリアがレオンの腕を抱き寄せ、二人で通りをうかがう。",
    width: 1536,
    height: 1024,
    revealAtLine: 4,
  },
  [MERRILL_SEEDLINGS_QUEST + "-departure"]: {
    src: "/stories/lico-protects-seedlings.webp",
    alt: "リコが苗の籠を抱え、食べようとするメリルの前に立つ。",
    width: 1536,
    height: 1024,
    revealAtLine: 14,
  },
  [GUILD_FOUNDING_QUEST + "-return"]: {
    src: "/stories/guild-formation.webp",
    alt: "リンデの受付でアリアが旅団の登録書に署名し、四人が見守る。",
    width: 1536,
    height: 1024,
    revealAtLine: 67,
  },
  [BERNE_QUEST + "-departure"]: {
    src: "/stories/finn-at-breakfast.webp",
    alt: "食堂の隣の席で、頬杖をついて三人へ話しかけるフィン。",
    width: 1536,
    height: 1024,
    revealAtLine: 5,
  },
  [STONE_RETURN_QUEST + "-departure"]: {
    src: "/stories/mira-tends-finn.webp",
    alt: "仕事の直前、ミラがフィンの傷ついた手を洗い、包帯を巻く。",
    width: 1536,
    height: 1024,
    revealAtLine: 5,
  },
  [BERNE_RESTORATION_QUEST + "-return"]: {
    src: "/stories/four-cups-of-tea.webp",
    alt: "灯りが戻ったベルネの食堂で、お茶を囲むアリア、レオン、ミラ、フィン。",
    width: 1536,
    height: 1024,
    revealAtLine: 5,
  },
  "waiting-households-return": {
    src: "/stories/medicine-delivered.webp",
    videoSrc: "/stories/videos/medicine-delivered.mp4",
    alt: "少年と母親の側から正面に見るミラ。目元に寝不足の疲れをにじませながら「あーん」と促し、薬をすくった匙を少年の口元へ運ぶ。",
    width: 1536,
    height: 1024,
    revealAtLine: 4,
  },
  "medicine-road-home-return": {
    src: "/stories/three-cups-of-tea.webp",
    alt: "コミカルにデフォルメされた三人のお茶。仕事のメモへ手を伸ばして気まずそうなミラ、得意げに紙を押さえるアリア、笑うレオン。",
    width: 1536,
    height: 1024,
    revealAtLine: 11,
  },
  "begging-golem-departure": {
    src: "/stories/begging-dolls.webp",
    alt: "山道でハロウィン風に飾った大小の人形がお辞儀して両手を差し出し、その少し後ろで小柄なプティがパンプキンヘッドをかぶって操る。",
    width: 1536,
    height: 1024,
    revealAtLine: 3,
  },
  "moonlit-herbs-return": {
    src: "/stories/mira-collapse.webp",
    alt: "膝が折れて倒れたミラの上体をレオンが支え、アリアが荷物をどけてそばへ駆け寄る。机には作りかけの薬が残っている。",
    width: 1536,
    height: 1024,
    revealAtLine: 6,
  },
  "tower-moss-removal-return": {
    src: "/stories/tower-light-restored.webp",
    alt: "夕暮れの丘で、フードを下ろしたアリアとレオンが石垣に寄り添って座り、正面の塔を見上げる後ろ姿。アリアの長い金髪と花飾りが見え、塔の窓には淡い紫の光がともる。",
    width: 1536,
    height: 1024,
    revealAtLine: 6,
  },
  "forest-wetland-return": {
    src: "/stories/forest-moss-aria.webp",
    alt: "木漏れ日が差す苔むした石壁の前で、二つの苔の入れ物を顔の近くへ持ち上げて見比べるアリア。金髪と緑の瞳、羽飾りのある緑のフードを繊細に描いている。",
    width: 1536,
    height: 1024,
    revealAtLine: 5,
  },
  "tower-road-return": {
    src: "/stories/tower-moss-discovery.webp",
    alt: "塔の足元で、アリアが木べらで分けた光る苔を、レオンの持つ浅い木の入れ物へ寄せる。小さな苔灯が二人の手元を淡く照らす。",
    width: 1536,
    height: 1024,
    revealAtLine: 20,
  },
  "village-trade-return": {
    src: "/stories/village-trade-handover.webp",
    alt: "街の店先で、アリアが布で包んだ薬草を店主に渡し、レオンが村から預かった交易品を台に置く。",
    width: 1536,
    height: 1024,
    revealAtLine: 0,
  },
};

export function storyThumbnail(art: StoryArt): string {
  return art.src.replace("/stories/", "/stories/thumbnails/").replace(/\.(png|webp)$/, ".webp");
}

export function storyArtAt(storyId: string, lineIndex: number): StoryArt | undefined {
  const art = storyArt[storyId];
  return art && lineIndex >= art.revealAtLine ? art : undefined;
}
