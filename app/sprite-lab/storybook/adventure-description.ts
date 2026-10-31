import { allQuests, targetName, type State } from "@/lib/game";
export const hasVisualProgress = (quest: string, painted: boolean) =>
  painted &&
  ["linde-requests", "lantern-detour", "brekka-arrival", "starlit-guild-founding"].includes(quest);
export function hasStudyStatus(quest: string) {
  return [
    "starlit-guild-founding",
    "linde-requests",
    "lantern-detour",
    "brekka-arrival",
    "glowing-moss-trail",
    "glowing-moss-trail-next-day",
    "brekka-moss-beds",
    "berne-restoration",
    "keystone-night-road",
    "garden-reception",
    "manor-survey",
    "matching-lantern-stone",
    "riverside-manor",
    "missing-keystone",
    "berne-house-calls",
    "berne-road",
    "waiting-households",
    "spinning-signpost",
    "begging-golem",
    "sweet-blockade",
    "hilltop-picnic",
    "medicine-packing",
    "old-waterway",
    "tower-moss-removal",
    "tower-restoration",
    "medicine-road-home",
    "tower-road",
    "moss-night-road",
    "village-trade",
    "evening-trade-road",
  ].includes(quest);
}
export function studyDescription(quest: string, fullParty: boolean) {
  const descriptions: Record<string, string> = {
    "starlit-guild-founding":
      "五人がブレッカから戻り、返事と借り物を届けてリンデへ向かう流れを確認します。",
    "linde-requests": "リンデの人へ手紙を渡し、日取りと返事を確かめます。",
    "lantern-detour": "四人で村はずれへ向かい、灯籠と道を確かめます。",
    "brekka-arrival": "四人で往診の荷を運び、町外れの魔物と仕入れの控えを確かめます。",
    "glowing-moss-trail": "アリアとレオンが、空籠の荷車と距離を置いて道を追います。",
    "glowing-moss-trail-next-day": "四人で昨日の道順をたどり、空籠の荷車を追います。",
    "brekka-moss-beds": "三人が塔のそばで苔床の列と水路、札を調べます。",
    "berne-restoration": "根を除き、石工と溝を確かめ、通り道を整えます。",
    "keystone-night-road": "石を載せた荷車を守りながら、夜道から橋へ向かいます。",
    "garden-reception": "鉢と包みを載せた荷車を押し、通路を確かめて展示台へ向かいます。",
    "manor-survey": "庭の鉢と布を整え、植え込みの道を確かめます。",
    "matching-lantern-stone": "保管石を運び、布を添えて比べ、寸法と記録を確かめます。",
    "riverside-manor": "勝手口へ包みを届け、庭へ鉢を運び、展示台へ向かいます。",
    "missing-keystone": "石段の土と根を払い、石工と図面・継ぎ目を調べます。",
    "berne-house-calls": "ベルネの家々へ包みと湯を届け、抜けた石畳を確かめます。",
    "berne-road": "四人の往診荷物、戦闘前後の置き直し・回収と、ベルネの門への接近を確認します。",
    "waiting-households": "三軒へ包みを届け、湯と水・仕分け・空き瓶・控えの五工程を進めます。",
    "sweet-blockade":
      "作業場の台に残された蜜を確かめ、大小の人形と操り手の登場・退き方を確認します。",
    "begging-golem": "荷物を後ろへ寄せ、小さな人形と大きなゴーレムから薬箱と二つの袋を守ります。",
    "spinning-signpost": "分かれ道で踏み跡を調べ、人形の背中の道標を取り戻して立て直します。",
    "hilltop-picnic": "昼食の袋と包みを持って坂を上り、戦闘前に置き、拾い直して進みます。",
    "medicine-packing": "瓶と蜜を別々に包み、荷札と控えを作業台で照らし合わせます。",
    "old-waterway": "図の照合、苔の多い石の確認、草に隠れた出口までの移動と戦闘を確認します。",
    "tower-restoration": "二人の足場、道具の配送と作業者による排水を確認します。",
  };
  const specific = descriptions[quest];
  if (specific) return specific;
  if (quest === "tower-moss-removal")
    return "点検口を開けて採取し、空籠を受け取り、次の点検口で回収して最後に蓋を戻します。";
  if (["village-trade", "evening-trade-road"].includes(quest))
    return "荷車を残した採取・戦闘と、持ち手へ戻って運搬する動きを確認します。";
  if (quest === "moss-night-road")
    return "瓶の苔灯と肩の布、レオンのランタン、戦闘前後の置き直しを確認します。";
  if (quest === "tower-road") return "畑と林を抜ける道の採取・戦闘と、丘の塔への接近を確認します。";
  if (quest === "medicine-road-home") return "三人の手荷物、道標、対向の荷車と作業場を確認します。";
  if (quest === "forest-wetland") return "湿った木陰を探し、苔を見分ける歩行と採取を確認します。";
  if (["forest-wetland", "moonlit-herbs"].includes(quest))
    return "林道の歩行・採取・戦闘を、背景と人物の共通縮尺で確認します。";
  if (fullParty) return "五人の待機・歩行・戦闘を同じ背景と縮尺で確認します。";
  return quest === "town-deliveries"
    ? "倉庫前の冒険。荷札を確かめ、二人で箱を運ぶ動きを再生します。"
    : "山道を進む三人の歩行と戦闘を再生します。";
}

export function studyStatus(state: State | null) {
  const run = state?.squads[0].run,
    q = allQuests.find((q) => q.id === run?.quest);
  if (!run || !q) return state ? "到着しました" : "準備中";
  const phase = run.enemies?.some((e) => e.hp > 0)
    ? "戦闘中"
    : { work: "作業中", move: "移動中", rest: "休憩中", arrived: "到着" }[run.phase];
  return `${String(Math.min(run.node + 1, run.nodes))}/${String(run.nodes)} · ${targetName(q, run.node, run.nodes)} · ${phase}`;
}
