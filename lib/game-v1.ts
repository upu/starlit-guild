export type Kind = "採取" | "護衛" | "討伐";
export const heroes = [
  {
    id: "aria",
    name: "アリア",
    job: "風読みのレンジャー",
    mark: "弓",
    color: "#7ab4a1",
    stats: [22, 10, 14],
    price: 0,
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
    price: 0,
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
    price: 0,
    trait: "護衛の心得",
    bio: "穏やかな旅団のお姉さん。お茶へのこだわりは強い。",
  },
  {
    id: "finn",
    name: "フィン",
    job: "いたずら好きの盗賊",
    mark: "影",
    color: "#bdb97d",
    stats: [24, 8, 17],
    price: 0,
    trait: "宝探し名人",
    bio: "宝箱には目がない。ミラには頭が上がらない。",
  },
  {
    id: "garr",
    name: "ガル",
    job: "山岳の守護騎士",
    mark: "盾",
    color: "#84a6b9",
    stats: [10, 36, 22],
    price: 450,
    trait: "鉄壁の守り",
    bio: "大きな盾と小さな裁縫道具を持つ、心優しい騎士。",
  },
  {
    id: "luna",
    name: "ルナ",
    job: "星屑の魔法使い",
    mark: "星",
    color: "#ada1df",
    stats: [20, 12, 38],
    price: 700,
    trait: "魔法の一撃",
    bio: "古代の星を研究中。夜ふかし仲間を探している。",
  },
  {
    id: "poppy",
    name: "ポピー",
    job: "森の錬金術師",
    mark: "葉",
    color: "#8ec293",
    stats: [40, 19, 12],
    price: 950,
    trait: "豊かな収穫",
    bio: "失敗した薬も「新しい味」と言い張る研究家。",
  },
  {
    id: "noel",
    name: "ノエル",
    job: "旅する吟遊詩人",
    mark: "詩",
    color: "#d69daa",
    stats: [22, 34, 23],
    price: 1300,
    trait: "旅路の歌",
    bio: "まだ見ぬ旅団の伝説を、一番近くで歌いたい。",
  },
];
export const quests = [
  {
    id: "herbs",
    name: "月しずく草の採取",
    kind: "採取" as Kind,
    region: "ささやきの森",
    desc: "月明かりを蓄える薬草を、薬師のもとへ。",
    tier: 1,
    need: 30,
    seconds: 60,
    gold: 32,
    xp: 12,
    herbs: 4,
    ore: 0,
  },
  {
    id: "cart",
    name: "パン屋の荷馬車",
    kind: "護衛" as Kind,
    region: "木漏れ日の街道",
    desc: "焼きたてのパンを隣町へ。つまみ食いは厳禁。",
    tier: 1,
    need: 34,
    seconds: 90,
    gold: 52,
    xp: 18,
    herbs: 1,
    ore: 2,
  },
  {
    id: "slime",
    name: "畑を荒らすスライム",
    kind: "討伐" as Kind,
    region: "クローバー平原",
    desc: "ぷるぷるの侵入者から、村の畑を守ろう。",
    tier: 1,
    need: 38,
    seconds: 120,
    gold: 70,
    xp: 24,
    herbs: 0,
    ore: 4,
  },
  {
    id: "crystal",
    name: "青晶石の採掘",
    kind: "採取" as Kind,
    region: "青く輝く洞窟",
    desc: "崩れやすい洞窟で、魔力を宿す鉱石を探す。",
    tier: 2,
    need: 85,
    seconds: 240,
    gold: 180,
    xp: 60,
    herbs: 2,
    ore: 12,
  },
  {
    id: "pilgrim",
    name: "星見の巡礼団",
    kind: "護衛" as Kind,
    region: "霧の山道",
    desc: "道に迷った巡礼者たちを、山頂の祠まで。",
    tier: 2,
    need: 90,
    seconds: 300,
    gold: 240,
    xp: 78,
    herbs: 8,
    ore: 8,
  },
  {
    id: "wolf",
    name: "霧狼の群れ",
    kind: "討伐" as Kind,
    region: "銀霧の渓谷",
    desc: "深い霧から聞こえる遠吠え。連携が試される。",
    tier: 2,
    need: 100,
    seconds: 360,
    gold: 310,
    xp: 95,
    herbs: 3,
    ore: 16,
  },
  {
    id: "blossom",
    name: "千年樹の花",
    kind: "採取" as Kind,
    region: "忘れられた樹海",
    desc: "千年に一度咲く花を求め、森の奥へ。",
    tier: 3,
    need: 170,
    seconds: 600,
    gold: 620,
    xp: 180,
    herbs: 35,
    ore: 10,
  },
  {
    id: "royal",
    name: "王女の秘密の旅",
    kind: "護衛" as Kind,
    region: "星降りの峠",
    desc: "お忍びの王女を護衛して、星の祭りへ。",
    tier: 3,
    need: 185,
    seconds: 720,
    gold: 800,
    xp: 230,
    herbs: 20,
    ore: 24,
  },
  {
    id: "dragon",
    name: "古塔の星喰い竜",
    kind: "討伐" as Kind,
    region: "星灯りの古塔",
    desc: "消えかけた星の灯りを取り戻す、旅団の大冒険。",
    tier: 3,
    need: 210,
    seconds: 900,
    gold: 1200,
    xp: 320,
    herbs: 15,
    ore: 45,
  },
];
export type Quest = (typeof quests)[number];
export const bonds = [
  {
    ids: ["aria", "leon"],
    name: "幼なじみの約束",
    bonus: 10,
    lines: ["アリア「こっちが近道！ たぶん！」", "レオン「その『たぶん』は何回目だ？」"],
  },
  {
    ids: ["mira", "finn"],
    name: "お目付け役と悪戯っ子",
    bonus: 10,
    lines: ["フィン「この宝箱、ちょっと開けても…」", "ミラ「帰ったらお説教とお茶ね。」"],
  },
  {
    ids: ["garr", "mira"],
    name: "やさしい守り手",
    bonus: 14,
    lines: [
      "ガル「みんなの荷物は、俺が持とう。」",
      "ミラ「貴方はみんなの荷物を、私はみんなの元気を。」",
    ],
  },
  {
    ids: ["luna", "noel"],
    name: "星と詩の物語",
    bonus: 16,
    lines: ["ルナ「星の声、聞こえる？」", "ノエル「ああ。次の歌が生まれそうだ。」"],
  },
  {
    ids: ["aria", "poppy"],
    name: "森のおすそわけ",
    bonus: 14,
    lines: ["ポピー「これ、飲めば空を飛べるかも！」", "アリア「かも、で飲ませないでよ！」"],
  },
];
export type State = {
  version: 1;
  gold: number;
  herbs: number;
  ore: number;
  owned: string[];
  party: string[];
  xp: Record<string, number>;
  gear: number;
  camp: number;
  clears: number;
  done: Record<string, number>;
  claimed: string[];
  lastDaily: string;
  active: null | { quest: string; started: number; duration: number };
  repeat: boolean;
  updatedAt: number;
  log: { text: string; at: number }[];
};
export const level = (xp: number) => Math.min(50, 1 + Math.floor(Math.sqrt(xp / 30)));
function heroById(id: string) {
  const hero = heroes.find((h) => h.id === id);
  if (!hero) throw Error(`仲間「${id}」が見つかりません。`);
  return hero;
}
function questById(id: string) {
  const quest = quests.find((q) => q.id === id);
  if (!quest) throw Error(`依頼「${id}」が見つかりません。`);
  return quest;
}
export function initialState(now: number): State {
  return {
    version: 1,
    gold: 120,
    herbs: 0,
    ore: 0,
    owned: ["aria", "leon", "mira", "finn"],
    party: ["aria", "leon", "mira"],
    xp: {},
    gear: 0,
    camp: 0,
    clears: 0,
    done: {},
    claimed: [],
    lastDaily: "",
    active: null,
    repeat: true,
    updatedAt: now,
    log: [{ text: "星灯りの旅団、結成。まずは森の依頼から始めよう。", at: now }],
  };
}
export const guildRank = (s: State) => (s.clears >= 40 ? 3 : s.clears >= 10 ? 2 : 1);
export const activeBonds = (s: State) =>
  bonds.filter((b) => b.ids.every((id) => s.party.includes(id)));
export function stats(s: State) {
  return [0, 1, 2].map((i) =>
    Math.floor(
      s.party.reduce((n, id) => {
        const h = heroById(id);
        return n + h.stats[i] * (1 + 0.1 * (level(s.xp[id] || 0) - 1));
      }, 0) *
        (1 + 0.08 * s.gear) +
        activeBonds(s).reduce((a, b) => a + b.bonus, 0),
    ),
  );
}
export const power = (s: State, q: Quest) => stats(s)[["採取", "護衛", "討伐"].indexOf(q.kind)];
export const duration = (s: State, q: Quest) => Math.round(q.seconds * 1000 * (1 - 0.04 * s.camp));
export const rewardGold = (s: State, q: Quest) =>
  Math.floor(q.gold * (s.party.includes("finn") ? 1.1 : 1) * (s.party.includes("noel") ? 1.1 : 1));
function log(s: State, text: string, at: number) {
  s.log = [{ text, at }, ...s.log].slice(0, 30);
}
export function settle(input: State, now: number) {
  const s = structuredClone(input);
  const elapsed = Math.max(0, now - s.updatedAt);
  const end = s.updatedAt + Math.min(elapsed, 12 * 3600 * 1000);
  let count = 0,
    gold = 0,
    xp = 0,
    herbs = 0,
    ore = 0;
  while (s.active && s.active.started + s.active.duration <= end) {
    const active = s.active,
      q = questById(active.quest),
      at = active.started + active.duration;
    const g = rewardGold(s, q);
    s.gold += g;
    s.herbs += q.herbs;
    s.ore += q.ore;
    s.clears++;
    s.done[q.id] = (s.done[q.id] || 0) + 1;
    s.party.forEach((id) => (s.xp[id] = (s.xp[id] || 0) + q.xp));
    count++;
    gold += g;
    xp += q.xp;
    herbs += q.herbs;
    ore += q.ore;
    if (s.repeat) {
      s.active = { quest: q.id, started: at, duration: duration(s, q) };
    } else {
      s.active = null;
    }
  }
  if (elapsed > 12 * 3600 * 1000 && s.active) s.active.started += elapsed - 12 * 3600 * 1000;
  if (count)
    log(
      s,
      `${String(count)}件の依頼を達成。${String(gold)} G・経験値 ${String(xp)}・薬草 ${String(herbs)}・鉱石 ${String(ore)} を獲得。`,
      now,
    );
  s.updatedAt = Math.max(now, s.updatedAt);
  return {
    state: s,
    rewards: {
      count,
      gold,
      xp,
      herbs,
      ore,
      offline: elapsed > 90000,
      capped: elapsed > 12 * 3600 * 1000,
    },
  };
}
export const achievements = [
  { id: "first", name: "旅立ちの一歩", desc: "クエストを1回達成", need: 1, gold: 100 },
  { id: "ten", name: "頼れる旅団", desc: "クエストを10回達成", need: 10, gold: 350 },
  { id: "forty", name: "星を追う者", desc: "クエストを40回達成", need: 40, gold: 800 },
  { id: "hundred", name: "百の冒険", desc: "クエストを100回達成", need: 100, gold: 2000 },
];
export type Action = {
  type:
    | "start"
    | "stop"
    | "party"
    | "recruit"
    | "gear"
    | "camp"
    | "claim"
    | "daily"
    | "repeat"
    | "sync";
  id?: string;
  party?: string[];
  value?: boolean;
};
type ActionHandler = (s: State, a: Action, now: number) => void;
function syncAction() {
  /* Cloning the current state completes synchronization. */
}
function startAction(s: State, a: Action, now: number) {
  if (s.active) throw Error("帰還してから次のクエストを選んでください。");
  const q = quests.find((item) => item.id === a.id);
  if (!q || q.tier > guildRank(s) || power(s, q) < q.need || s.party.length !== 3)
    throw Error("3人の編成・旅団ランク・推奨能力を確認してください。");
  s.active = { quest: q.id, started: now, duration: duration(s, q) };
  log(s, `${q.name}へ出発！ ${s.party.map((id) => heroById(id).name).join("、")}`, now);
}
function stopAction(s: State, _a: Action, now: number) {
  s.active = null;
  log(s, "旅団が帰還しました。途中の依頼の報酬はありません。", now);
}
function validParty(s: State, party: unknown): party is string[] {
  return (
    Array.isArray(party) &&
    party.length === 3 &&
    new Set(party).size === 3 &&
    party.every((id) => typeof id === "string" && s.owned.includes(id))
  );
}
function partyAction(s: State, a: Action) {
  if (s.active) throw Error("編成は帰還してから変更できます。");
  if (!validParty(s, a.party)) throw Error("仲間を3人選んでください。");
  s.party = a.party;
}
function repeatAction(s: State, a: Action) {
  if (typeof a.value !== "boolean") throw Error("設定を確認してください。");
  s.repeat = a.value;
}
function recruitAction(s: State, a: Action, now: number) {
  const hero = heroes.find((item) => item.id === a.id);
  if (!hero || s.owned.includes(hero.id) || s.gold < hero.price)
    throw Error("仲間の加入費用が足りません。");
  s.gold -= hero.price;
  s.owned.push(hero.id);
  log(s, `${hero.name}が旅団に加わりました。新しい冒険の予感！`, now);
}
function gearAction(s: State, _a: Action, now: number) {
  const cost = 120 * (s.gear + 1),
    ore = 8 * (s.gear + 1);
  if (s.gear >= 15 || s.gold < cost || s.ore < ore)
    throw Error("強化に必要なお金か鉱石が足りません。");
  s.gold -= cost;
  s.ore -= ore;
  s.gear++;
  log(s, `旅団の装備が Lv.${String(s.gear)} に。全能力が上がりました。`, now);
}
function campAction(s: State, _a: Action, now: number) {
  const cost = 150 * (s.camp + 1),
    herbs = 12 * (s.camp + 1);
  if (s.camp >= 10 || s.gold < cost || s.herbs < herbs)
    throw Error("改築に必要なお金か薬草が足りません。");
  s.gold -= cost;
  s.herbs -= herbs;
  s.camp++;
  log(s, `野営地が Lv.${String(s.camp)} に。次の周回から冒険が速くなります。`, now);
}
function claimAction(s: State, a: Action, now: number) {
  const achievement = achievements.find((item) => item.id === a.id);
  if (!achievement || s.claimed.includes(achievement.id) || s.clears < achievement.need)
    throw Error("この実績はまだ受け取れません。");
  s.claimed.push(achievement.id);
  s.gold += achievement.gold;
  log(s, `実績「${achievement.name}」達成！ ${String(achievement.gold)} G を獲得。`, now);
}
function dailyAction(s: State, _a: Action, now: number) {
  const date = new Date(now).toISOString().slice(0, 10);
  if (s.lastDaily === date) throw Error("今日の差し入れは受取済みです。");
  s.lastDaily = date;
  s.gold += 80;
  s.herbs += 5;
  log(s, "ギルドからの差し入れ。80 G と薬草5個を獲得。", now);
}
const actionHandlers: Record<Action["type"], ActionHandler> = {
  sync: syncAction,
  start: startAction,
  stop: stopAction,
  party: partyAction,
  repeat: repeatAction,
  recruit: recruitAction,
  gear: gearAction,
  camp: campAction,
  claim: claimAction,
  daily: dailyAction,
};
export function act(input: State, a: Action, now: number) {
  const s = structuredClone(input),
    handlers = actionHandlers as Partial<Record<string, ActionHandler>>,
    handler = Object.prototype.hasOwnProperty.call(handlers, a.type) ? handlers[a.type] : undefined;
  if (!handler) throw Error("操作を確認してください。");
  handler(s, a, now);
  return s;
}
