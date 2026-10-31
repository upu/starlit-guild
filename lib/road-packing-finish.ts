import type { PackingHero } from "./road-packing-contacts.ts";
export const PACKING_PACKET_WIDTH = 76;
export const packingFinishAssets = {
  medicine0: "/storybook-study/packing-wrap-medicine-0-v1.webp",
  medicine1: "/storybook-study/packing-wrap-medicine-1-v1.webp",
  medicine2: "/storybook-study/packing-wrap-medicine-2-v1.webp",
  medicine3: "/storybook-study/packing-wrap-medicine-3-v1.webp",
  honey0: "/storybook-study/packing-wrap-honey-0-v1.webp",
  honey1: "/storybook-study/packing-wrap-honey-1-v1.webp",
  honey2: "/storybook-study/packing-wrap-honey-2-v1.webp",
  honey3: "/storybook-study/packing-wrap-honey-3-v1.webp",
  bag0: "/storybook-study/packing-bag-close-0-v1.webp",
  bag1: "/storybook-study/packing-bag-close-1-v1.webp",
  bag2: "/storybook-study/packing-bag-close-2-v1.webp",
  bag3: "/storybook-study/packing-bag-close-3-v1.webp",
};
export function packingWrapAsset(id: PackingHero, frame: number) {
  const a = packingFinishAssets;
  return (
    id === "aria"
      ? [a.medicine0, a.medicine1, a.medicine2, a.medicine3]
      : [a.honey0, a.honey1, a.honey2, a.honey3]
  )[frame];
}
export const packingBagAsset = (frame: number) =>
  [
    packingFinishAssets.bag0,
    packingFinishAssets.bag1,
    packingFinishAssets.bag2,
    packingFinishAssets.bag3,
  ][frame];
export function packingWrapFrame(phase: number, age: number) {
  if (phase === 0) return 0;
  if (phase === 1) return Math.max(0, Math.min(2, Math.floor(age / 600)));
  return age < 500 ? 2 : 3;
}
