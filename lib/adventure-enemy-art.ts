export const adventureEnemyArt = { cell: 1024, foot: 960, height: 384 };
export const adventureEnemyIds = [
  "slime",
  "wolf",
  "dragon",
  "plant",
  "pumpety",
  "puppet",
  "golem",
  "lico-standing",
  "merrill-standing",
  "merrill-song",
  "mushroom",
] as const;
export type AdventureEnemyId = (typeof adventureEnemyIds)[number];
export const adventureEnemyAsset = (id: AdventureEnemyId) => `/adventure-enemies/${id}.webp`;
const ordinaryArt: Partial<Record<string, AdventureEnemyId>> = {
  "8": "slime",
  "9": "wolf",
  "10": "dragon",
  "11": "plant",
};
export const ordinaryEnemyArt = (frame: string): AdventureEnemyId => ordinaryArt[frame] ?? "slime";
export function restyledEnemyAsset(asset: string, sprite: number) {
  if (asset === "/sprites.png") return adventureEnemyAsset(ordinaryEnemyArt(String(sprite)));
  const legacy: Partial<Record<string, AdventureEnemyId>> = {
    "/enemies/masked-pumpety.png": "pumpety",
    "/enemies/mountain-puppet.png": "puppet",
    "/enemies/cargo-golem.png": "golem",
    "/animations/road/lico-standing-v1.webp": "lico-standing",
    "/animations/road/merrill-standing-v1.webp": "merrill-standing",
    "/animations/road/merrill-song-v1.webp": "merrill-song",
    "/animations/road/mushroom-v1.webp": "mushroom",
  };
  const id = legacy[asset];
  return id ? adventureEnemyAsset(id) : asset;
}

export const originalEnemyArt: Record<
  AdventureEnemyId,
  { asset: string; index?: number; rect?: readonly [number, number, number, number] }
> = {
  slime: { asset: "/sprites.png", index: 8 },
  wolf: { asset: "/sprites.png", index: 9 },
  dragon: { asset: "/sprites.png", index: 10 },
  plant: { asset: "/sprites.png", index: 11 },
  pumpety: { asset: "/animations/road/puppets-v1.webp", rect: [0, 0, 740, 724] },
  puppet: { asset: "/animations/road/puppets-v1.webp", rect: [740, 0, 610, 724] },
  golem: { asset: "/animations/road/puppets-v1.webp", rect: [1350, 0, 822, 724] },
  "lico-standing": { asset: "/animations/road/lico-standing-v1.webp" },
  "merrill-standing": { asset: "/animations/road/merrill-standing-v1.webp" },
  "merrill-song": { asset: "/animations/road/merrill-song-v1.webp" },
  mushroom: { asset: "/animations/road/mushroom-v1.webp" },
};
