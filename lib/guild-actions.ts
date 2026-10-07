import type { Action } from "./game-actions.ts";
import type { State, Squad } from "./game-types.ts";
import { guildUnlocked } from "./guild-base.ts";
import { initialGuild, type GuildState } from "./guild-types.ts";
import {
  guildRoles,
  guildPlots,
  openGuildPlots,
  guildProducts,
  guildCrops,
  guildRecipes,
  plotRole,
  GUILD_STOCK_CAP,
} from "./guild-content.ts";
import { guildStock, startPlant, startWork } from "./guild-production.ts";
import { settleGuild } from "./guild-engine.ts";
import { homeLayoutSchema } from "./home-room-schema.ts";

function buy(s: State, guild: GuildState, action: Action) {
  const product = guildProducts.find((item) => item.id === action.id),
    quantity = action.quantity ?? 1;
  if (!product || (quantity !== 1 && quantity !== 10))
    throw Error("購入する種・材料と数を確認してください。");
  if (s.gold < product.price * quantity) throw Error("お金が足りません。");
  if (guildStock(s, product.id) + quantity > GUILD_STOCK_CAP) throw Error("これ以上持てません。");
  s.gold -= product.price * quantity;
  guild.materials[product.id] = guildStock(s, product.id) + quantity;
}
function assign(s: State, guild: GuildState, action: Action) {
  const role = guildRoles.find((id) => id === action.id),
    hero = action.hero;
  if (!role || (hero && !s.owned.includes(hero))) throw Error("担当者を確認してください。");
  if (hero && guildRoles.some((id) => id !== role && guild.roles[id] === hero))
    throw Error("その人は別の仕事を担当しています。");
  if (role === "workbench") pauseWork(guild, hero);
  if (hero) guild.roles[role] = hero;
  else guild.roles = Object.fromEntries(Object.entries(guild.roles).filter(([id]) => id !== role));
}
function pauseWork(guild: GuildState, hero?: string) {
  const work = guild.work;
  if (work?.batch) {
    if (!hero && work.pausedMs === undefined)
      work.pausedMs = Math.max(0, work.batch.readyAt - guild.lastAt);
    if (hero && work.pausedMs !== undefined) {
      work.batch.readyAt = guild.lastAt + work.pausedMs;
      delete work.pausedMs;
    }
  }
}
function plant(s: State, guild: GuildState, action: Action) {
  const id = openGuildPlots.find((plot) => plot === action.id),
    crop = guildCrops.find((item) => item.id === action.name);
  if (!id || !crop || crop.role !== plotRole(id))
    throw Error("この畑に植える作物を確認してください。");
  if (guild.plots[id].batch) throw Error("育っている作物は収穫まで待ちましょう。");
  if (guildStock(s, crop.seed) < 1) throw Error("種が足りません。お店で購入できます。");
  guild.plots[id].crop = crop.id;
  startPlant(s, guild, id, guild.lastAt);
}
function craft(s: State, guild: GuildState, action: Action) {
  if (guild.work) throw Error("今の加工を終えるか、中止してください。");
  if (!guild.roles.workbench) throw Error("加工の担当者を選んでください。");
  if (!guildRecipes.some((item) => item.id === action.id))
    throw Error("作り方を確認してください。");
  const quantity = action.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
    throw Error("作る回数は1〜99にしてください。");
  guild.work = { recipe: action.id ?? "", remaining: action.value ? null : quantity };
  startWork(s, guild, guild.lastAt);
}
function arrange(guild: GuildState, action: Action) {
  const layout = homeLayoutSchema.safeParse(action.furniture);
  if (!layout.success) throw Error(layout.error.issues[0].message);
  guild.home = layout.data;
}
export function guildAction(s: State, _squad: Squad, action: Action, now: number) {
  if (!guildUnlocked(s)) throw Error("旅団の拠点は第五章から使えます。");
  const guild = (s.guild ??= initialGuild(now));
  if (action.type === "guildBuy") buy(s, guild, action);
  else if (action.type === "guildArrange") arrange(guild, action);
  else if (action.type === "guildAssign") assign(s, guild, action);
  else if (action.type === "guildPlant") plant(s, guild, action);
  else if (action.type === "guildCraft") craft(s, guild, action);
  else if (action.type === "guildReplant") {
    const id = guildPlots.find((plot) => plot === action.id);
    if (!id || !openGuildPlots.includes(id)) throw Error("畑を確認してください。");
    guild.plots[id].replant = action.value !== false;
  } else if (action.type === "guildCancel") delete guild.work;
  settleGuild(s, guild.lastAt);
}
