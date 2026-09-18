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
    bio: "薬草を見つける目は確か。気になるものを見つけると、考えるより先に足が向く。",
  },
  {
    id: "leon",
    name: "レオン",
    job: "旅路を守る剣士",
    mark: "剣",
    color: "#d3a070",
    stats: [8, 17, 24],
    trait: "魔物に強い",
    bio: "地図と荷物を確かめ、帰り道まで段取りを組む。仲間の発見があれば、調べた道筋も見直す。",
  },
  {
    id: "mira",
    name: "ミラ",
    job: "月詠みの治癒師",
    mark: "月",
    color: "#ab9ac7",
    stats: [16, 22, 8],
    trait: "護衛の心得",
    bio: "人の小さな不調を見逃さず、診察と手当てに向かう。穏やかな口調で「あと一人だけ」と仕事を増やしてしまう。",
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
