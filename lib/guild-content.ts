export const GUILD_LEVEL_CAP = 3;
export const GUILD_STOCK_CAP = 9999;
export const guildRoles = ["linde", "brekka", "workbench"] as const;
export type GuildRole = (typeof guildRoles)[number];
export const guildPlots = ["linde-1", "linde-2", "brekka-1"] as const;
export type GuildPlotId = (typeof guildPlots)[number];
export const plotRole = (id: GuildPlotId): GuildRole => (id === "brekka-1" ? "brekka" : "linde");
export const guildProducts = [
  { id: "herb-seed", name: "薬草の種", price: 5 },
  { id: "carrot-seed", name: "ニンジンの種", price: 8 },
  { id: "moss-spore", name: "苔の胞子", price: 12 },
  { id: "flour", name: "小麦粉", price: 4 },
  { id: "walnut", name: "胡桃", price: 6 },
  { id: "honey", name: "蜂蜜", price: 6 },
  { id: "butter", name: "バター", price: 5 },
];
export const guildMaterials = [
  ...guildProducts,
  { id: "carrot", name: "ニンジン" },
  { id: "dried-moss", name: "乾燥苔" },
];
export const guildMaterialName = (id: string) =>
  id === "herbs" ? "薬草" : (guildMaterials.find((item) => item.id === id)?.name ?? id);
export const guildCrops = [
  {
    id: "herb",
    name: "薬草",
    role: "linde",
    seed: "herb-seed",
    output: "herbs",
    minutes: 60,
    yield: 3,
  },
  {
    id: "carrot",
    name: "ニンジン",
    role: "linde",
    seed: "carrot-seed",
    output: "carrot",
    minutes: 90,
    yield: 2,
  },
  {
    id: "moss",
    name: "苔",
    role: "brekka",
    seed: "moss-spore",
    output: "dried-moss",
    minutes: 120,
    yield: 2,
  },
] as const;
export type GuildRecipe = {
  id: string;
  name: string;
  expert: string;
  minutes: number;
  steepMinutes?: number;
  output: string;
  ingredients: Record<string, number>;
};
export const guildRecipes: GuildRecipe[] = [
  {
    id: "lunch",
    name: "胡桃と野菜のお弁当",
    expert: "leon",
    minutes: 15,
    output: "guild-lunch",
    ingredients: { carrot: 1, flour: 1, walnut: 1, butter: 1 },
  },
  {
    id: "tea",
    name: "薬草と蜂蜜のお茶",
    expert: "mira",
    minutes: 10,
    steepMinutes: 3,
    output: "guild-tea",
    ingredients: { herbs: 2, honey: 1 },
  },
  {
    id: "soda",
    name: "苔入り薬草ソーダ",
    expert: "lico",
    minutes: 20,
    output: "guild-soda",
    ingredients: { herbs: 2, "dried-moss": 1, honey: 1 },
  },
];
export const guildLevel = (experience: number) =>
  Math.min(GUILD_LEVEL_CAP, 1 + Math.floor(experience / 5));
