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
  {
    id: "finn",
    name: "フィン",
    job: "口八丁の仲介人",
    mark: "短剣",
    color: "#b69a71",
    stats: [20, 12, 19],
    trait: "器用な手さばき",
    bio: "人脈と指先の腕を頼りに仕事を運ぶ仲介人。腕は確かだが、話が全部とは限らない。",
  },
  {
    id: "lico",
    name: "リコ",
    job: "発光と毒の錬金術師",
    mark: "瓶",
    color: "#b85b62",
    stats: [27, 16, 11],
    trait: "試料の見立て",
    bio: "発光と毒を追い、気になるものへすぐ手が伸びる。研究のためなら予定も忘れるが、見つけた違和感は見逃さない。",
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
export const maxLevel = 50;
export const level = (xp: number) => Math.min(maxLevel, 1 + Math.floor(Math.sqrt(xp / 30)));
/** Total XP at which a hero reaches the given level. */
export const levelStartXp = (lv: number) => 30 * (lv - 1) ** 2;
/** Where the XP sits inside the current level; `next` is null at the level cap. */
export function levelProgress(xp: number) {
  const lv = level(xp),
    start = levelStartXp(lv);
  if (lv >= maxLevel) return { level: lv, xp, start, next: null, remaining: 0, ratio: 1 };
  const next = levelStartXp(lv + 1);
  return { level: lv, xp, start, next, remaining: next - xp, ratio: (xp - start) / (next - start) };
}
