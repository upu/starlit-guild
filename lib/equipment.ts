import type { State } from "./game.ts";
import { stageUnlocked, TOWER_QUEST } from "./prologue.ts";

export type EquipmentSlot = "weapon" | "armor";
export type Equipment = {
  id: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  heroes?: string[];
  bonus: [number, number, number];
  price: number;
  tier: number;
};
export type Inventory = {
  items: Record<string, number>;
  equipped: Partial<Record<string, Partial<Record<EquipmentSlot, string>>>>;
};
export const equipment: Equipment[] = [
  {
    id: "familiar-bow",
    name: "使い慣れた弓",
    description: "アリアが手になじませてきた弓。いつもの交易にも携えている。",
    slot: "weapon",
    heroes: ["aria"],
    bonus: [0, 0, 0],
    price: 0,
    tier: 0,
  },
  {
    id: "familiar-sword",
    name: "使い慣れた剣",
    description: "レオンが手入れを続けている剣。街道を歩くときの備え。",
    slot: "weapon",
    heroes: ["leon"],
    bonus: [0, 0, 0],
    price: 0,
    tier: 0,
  },
  {
    id: "travel-clothes",
    name: "旅の服",
    description: "動きやすい、いつもの旅支度。",
    slot: "armor",
    bonus: [0, 0, 0],
    price: 0,
    tier: 0,
  },
  {
    id: "ash-bow",
    name: "トネリコの弓",
    description: "しなりがよく、狙いを定めやすい弓。",
    slot: "weapon",
    heroes: ["aria"],
    bonus: [1, 0, 2],
    price: 100,
    tier: 1,
  },
  {
    id: "steel-sword",
    name: "鋼の小剣",
    description: "取り回しのよい、街道歩きに向く剣。",
    slot: "weapon",
    heroes: ["leon"],
    bonus: [0, 1, 2],
    price: 100,
    tier: 1,
  },
  {
    id: "leather-vest",
    name: "革の上着",
    description: "肩と胸元を守る、軽い革の上着。",
    slot: "armor",
    bonus: [0, 2, 0],
    price: 80,
    tier: 1,
  },
  {
    id: "gathering-coat",
    name: "採取の上着",
    description: "枝に引っかかりにくく、しゃがみやすい仕立て。",
    slot: "armor",
    bonus: [2, 0, 0],
    price: 80,
    tier: 1,
  },
];
export const equipmentById = (id: string) => equipment.find((item) => item.id === id);
export const canEquip = (item: Equipment, hero: string) =>
  !item.heroes || item.heroes.includes(hero);
export function initialInventory(): Inventory {
  return {
    items: { "familiar-bow": 1, "familiar-sword": 1, "travel-clothes": 2 },
    equipped: {
      aria: { weapon: "familiar-bow", armor: "travel-clothes" },
      leon: { weapon: "familiar-sword", armor: "travel-clothes" },
    },
  };
}
// Missing fields in old saves represent the same zero-bonus starting equipment.
export const inventoryOf = (s: Pick<State, "inventory">) => s.inventory ?? initialInventory();
export function equippedItems(s: Pick<State, "inventory">, hero: string) {
  return Object.values(inventoryOf(s).equipped[hero] ?? {}).flatMap((id) => {
    const item = equipmentById(id);
    return item ? [item] : [];
  });
}
export function equipmentBonus(s: Pick<State, "inventory">, hero: string) {
  const items = equippedItems(s, hero);
  return [0, 1, 2].map((index) => items.reduce((sum, item) => sum + item.bonus[index], 0));
}
export function equippedBy(s: Pick<State, "inventory">, id: string) {
  return Object.entries(inventoryOf(s).equipped)
    .filter(([, slots]) => Object.values(slots ?? {}).includes(id))
    .map(([hero]) => hero);
}
export function availableCopies(s: Pick<State, "inventory">, id: string) {
  return (inventoryOf(s).items[id] ?? 0) - equippedBy(s, id).length;
}
export function shopTier(s: State) {
  const unlocked = stageUnlocked(s, TOWER_QUEST);
  return unlocked ? 1 : 0;
}
export const shopItems = (s: State) =>
  equipment.filter((item) => item.price > 0 && item.tier <= shopTier(s));
export function buyEquipment(s: State, id: string) {
  const item = shopItems(s).find((item) => item.id === id);
  if (!item) throw Error("この品はまだお店に並んでいません。");
  if (s.gold < item.price) throw Error("お金が足りません。");
  const inventory = (s.inventory ??= initialInventory());
  if ((inventory.items[id] ?? 0) >= 9999) throw Error("これ以上持てません。");
  s.gold -= item.price;
  inventory.items[id] = (inventory.items[id] ?? 0) + 1;
  return item;
}
function checkEquipment(s: State, hero: string, slot: EquipmentSlot, id: string, current?: string) {
  const item = equipmentById(id);
  if (!item || item.slot !== slot || !canEquip(item, hero))
    throw Error("このキャラクターには装備できません。");
  if (current !== id && availableCopies(s, id) < 1) throw Error("バッグに使える装備がありません。");
}
export function changeEquipment(s: State, hero: string, slot: string, id?: string) {
  if (!s.owned.includes(hero)) throw Error("装備するキャラクターを確認してください。");
  if (slot !== "weapon" && slot !== "armor") throw Error("装備する場所を確認してください。");
  const inventory = (s.inventory ??= initialInventory()),
    slots = inventory.equipped[hero] ?? {};
  if (id) checkEquipment(s, hero, slot, id, slots[slot]);
  if (id) slots[slot] = id;
  else if (slot === "weapon") delete slots.weapon;
  else delete slots.armor;
  inventory.equipped[hero] = slots;
}
export function validInventory(inventory: Inventory, owned: string[]) {
  const state = { inventory };
  for (const [hero, slots] of Object.entries(inventory.equipped)) {
    if (!owned.includes(hero) || !slots) return false;
    for (const [slot, id] of Object.entries(slots)) {
      const item = equipmentById(id);
      if (!item || item.slot !== slot || !canEquip(item, hero)) return false;
    }
  }
  return equipment.every((item) => availableCopies(state, item.id) >= 0);
}
