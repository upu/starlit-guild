import { shopTier } from "./equipment.ts";
import type { State } from "./game-types.ts";

export type Consumable = {
  id: string;
  name: string;
  description: string;
  price?: number;
  tier: number;
  effect: { timing: "pinch"; healing: number } | { timing: "departure"; experience: number };
};
export type ShopConsumable = Consumable & { price: number };
export type Consumables = {
  items: Record<string, number>;
  assigned: Partial<Record<string, string>>;
};
export const consumables: Consumable[] = [
  {
    id: "herbs",
    name: "薬草",
    description:
      "冒険で手に入る薬草。ダメージを受けてHPが40%以下なら、自動で1個使い、HPを15回復。倒れた人には使いません。",
    tier: 1,
    effect: { timing: "pinch", healing: 15 },
  },
  {
    id: "salve",
    name: "傷薬",
    description:
      "ダメージを受けてHPが40%以下なら、自動で1個使い、HPを30回復。倒れた人には使いません。",
    price: 10,
    tier: 1,
    effect: { timing: "pinch", healing: 30 },
  },
  {
    id: "fine-salve",
    name: "上等な傷薬",
    description:
      "ダメージを受けてHPが40%以下なら、自動で1個使い、HPを80回復。倒れた人には使いません。",
    price: 30,
    tier: 2,
    effect: { timing: "pinch", healing: 80 },
  },
  {
    id: "travel-biscuit",
    name: "旅のビスケット",
    description: "出発時に1個使い、その人の経験値がその周回だけ10%増加。自動周回でも毎周使います。",
    price: 10,
    tier: 1,
    effect: { timing: "departure", experience: 0.1 },
  },
];
export const consumableById = (id: string) => consumables.find((item) => item.id === id);
// Keep the existing herb balance (including fractional gathering rewards) as the sole source.
export const consumableStock = (s: State, id: string) =>
  id === "herbs" ? Math.floor(s.herbs) : (s.consumables?.items[id] ?? 0);
export const assignedConsumable = (s: State, hero: string) =>
  consumableById(s.consumables?.assigned[hero] ?? "");
export const availableConsumables = (s: State) =>
  consumables.filter((item) => item.tier <= shopTier(s));
export const shopConsumables = (s: State) =>
  availableConsumables(s).filter((item): item is ShopConsumable => item.price !== undefined);
export function buyConsumable(s: State, id: string, quantity: number) {
  const item = shopConsumables(s).find((item) => item.id === id);
  if (!item) throw Error("この品はまだお店に並んでいません。");
  if (quantity !== 1 && quantity !== 10) throw Error("購入する数を確認してください。");
  if (s.gold < item.price * quantity) throw Error("お金が足りません。");
  if (consumableStock(s, id) + quantity > 9999) throw Error("これ以上持てません。");
  const bag = (s.consumables ??= { items: {}, assigned: {} });
  s.gold -= item.price * quantity;
  bag.items[id] = (bag.items[id] ?? 0) + quantity;
  return item;
}
export function assignConsumable(s: State, hero: string, id?: string) {
  if (!s.owned.includes(hero)) throw Error("アイテムを使うキャラクターを確認してください。");
  if (!shopTier(s)) throw Error("お店が開くとアイテムを登録できます。");
  if (id && !availableConsumables(s).some((item) => item.id === id))
    throw Error("登録するアイテムを確認してください。");
  const bag = (s.consumables ??= { items: {}, assigned: {} });
  if (id) bag.assigned[hero] = id;
  else
    bag.assigned = Object.fromEntries(
      Object.entries(bag.assigned).filter(([owner]) => owner !== hero),
    );
}
export function consume(s: State, id: string) {
  if (id === "herbs") {
    if (s.herbs < 1) return false;
    s.herbs--;
    return true;
  }
  if (!s.consumables || consumableStock(s, id) < 1) return false;
  s.consumables.items[id]--;
  return true;
}
