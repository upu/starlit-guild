// Heroes, the pair bonus and levelling for the story mode.
// Extracted from the removed v1 module so the migration chain could go.
export type Kind = "採取" | "護衛" | "討伐";
export const heroes = [
  {
    id: "aria",
    name: "アリア",
    job: "風読みのレンジャー",
    mark: "弓",
    color: "#7ab4a1",
    stats: [22, 10, 14],
    trait: "採取の達人",
    bio: "風の匂いで薬草を見つける。方向音痴は秘密。",
  },
  {
    id: "leon",
    name: "レオン",
    job: "暁の剣士",
    mark: "剣",
    color: "#d3a070",
    stats: [8, 17, 24],
    trait: "魔物に強い",
    bio: "真面目な剣士。地図より仲間の言葉を信じる。",
  },
  {
    id: "mira",
    name: "ミラ",
    job: "月詠みの治癒師",
    mark: "月",
    color: "#ab9ac7",
    stats: [16, 22, 8],
    trait: "護衛の心得",
    bio: "穏やかな旅団のお姉さん。お茶へのこだわりは強い。",
  },
];
export const bonds = [
  {
    ids: ["aria", "leon"],
    name: "幼なじみの約束",
    bonus: 10,
    lines: ["アリア「こっちが近道！ たぶん！」", "レオン「その『たぶん』は何回目だ？」"],
  },
];
export const level = (xp: number) => Math.min(50, 1 + Math.floor(Math.sqrt(xp / 30)));
