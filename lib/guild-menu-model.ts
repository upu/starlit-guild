import { guildRoomArt } from "./guild-room-art.ts";
export const guildGoods = {
  "herb-seed": 0,
  "carrot-seed": 1,
  "moss-spore": 2,
  flour: 3,
  walnut: 4,
  honey: 5,
  butter: 6,
  "guild-lunch": 7,
  "guild-tea": 8,
  "guild-soda": 9,
  herbs: 10,
  "dried-moss": 11,
} as const;
export function guildGoodFrame(id: string) {
  return Object.hasOwn(guildGoods, id) ? guildGoods[id as keyof typeof guildGoods] : 10;
}
export function guildShopSpot(index: number) {
  return {
    x: index === 6 ? 0.5 : 0.23 + (index % 3) * 0.27,
    y: 0.47 + Math.floor(index / 3) * 0.225,
  };
}
export function guildRecipeSpot(index: number) {
  return { x: 0.2 + index * 0.3, y: 0.89 };
}
export function guildRoomSprite(atlas: keyof typeof guildRoomArt, index: number) {
  const sheet = guildRoomArt[atlas];
  return {
    asset: `/guild/${atlas}.webp`,
    rect: sheet.frames[index],
    width: sheet.width,
    height: sheet.height,
  };
}
