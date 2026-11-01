import type Phaser from "phaser";
import {
  STORYBOOK_PARCEL,
  STORYBOOK_CART,
  STORYBOOK_MEDICAL_CART,
  STORYBOOK_SEEDLING_CART,
  STORYBOOK_EARTHWORK,
  STORYBOOK_HERB,
  STORYBOOK_MOSS,
} from "@/lib/road-storybook-work";
import type { Traveller } from "@/lib/road-view";
import type { HandheldItem } from "@/lib/road-handheld";
import { townParcelAsset } from "@/lib/road-town-parcel";
import {
  foundingRecipient,
  foundingRecipientTurn,
  foundingRecipientWalk,
} from "@/lib/road-founding-recipient";
import { tradeCartBodies, tradeWheelAsset } from "@/lib/road-trade-cart-wheels";
import { foundingCartBody } from "@/lib/road-founding-wheel";
import { foundingPullAsset, foundingPullRestAsset } from "@/lib/road-founding-grip";
import { picnicAssets, picnicLeonPose } from "@/lib/road-picnic";
import { STORYBOOK_WAREHOUSE, STORYBOOK_HILL_TOWER } from "@/lib/road-scrolling-background";
export const storybookRoadHeroIds = ["aria", "leon", "mira", "finn", "lico"];

export function roadWalkPose(
  time: number,
  id: Traveller["id"],
  look?: { storybookHeroes?: boolean },
) {
  // Four painted phases retain the original eight-phase cycle's 720ms stride.
  const frameMs = look?.storybookHeroes && storybookRoadHeroIds.includes(id) ? 180 : 90;
  return `walk-${String(Math.floor(time / frameMs) % 8)}`;
}

const asset = (id: string, walking: boolean) => {
  if (id === "finn")
    return `/storybook-study/finn-${walking ? "walk-balanced-v3" : "conversation-balanced-v3"}.webp`;
  if (id === "lico")
    return `/storybook-study/lico-${walking ? "walk-ponytail-v2" : "conversation-ponytail-v1"}.webp`;
  return `/storybook-study/${id}-${walking ? "walk" : "conversation"}-v1.webp`;
};
const battleAsset = (id: string) =>
  `/storybook-study/${id === "finn" ? "finn-battle-balanced-v2" : `${id}-battle-v1`}.webp`;
const earthworkAsset = (id: string) =>
  `/storybook-study/${id === "finn" ? "finn-earthwork-balanced-v2" : `${id}-earthwork-v1`}.webp`;

export const storybookRoadAssets = storybookRoadHeroIds.flatMap((id) => [
  asset(id, false),
  asset(id, true),
  battleAsset(id),
]);
const workAssets: Record<string, string> = {
  "leon:pull": "/storybook-study/leon-pull-v1.webp",
  "aria:push": "/storybook-study/aria-push-v3.webp",
  "leon:pack": "/storybook-study/leon-work-v1.webp",
  "aria:pack": "/storybook-study/aria-work-v1.webp",
  "finn:pull": "/storybook-study/finn-pull-balanced-v3.webp",
  "aria:forage": "/storybook-study/aria-forage-v1.webp",
  "leon:forage": "/storybook-study/leon-forage-v1.webp",
};
storybookRoadAssets.push(...Object.values(workAssets));
storybookRoadAssets.push(STORYBOOK_PARCEL);
storybookRoadAssets.push(townParcelAsset);
storybookRoadAssets.push(foundingRecipient, foundingRecipientTurn, foundingRecipientWalk);
storybookRoadAssets.push(
  ...["aria", "leon"].flatMap((id) => [
    `/storybook-study/${id}-carry-v1.webp`,
    `/storybook-study/${id}-paper-walk-${id === "aria" ? "v1" : "v2"}.webp`,
  ]),
);
storybookRoadAssets.push(STORYBOOK_CART);
storybookRoadAssets.push(STORYBOOK_MEDICAL_CART);
storybookRoadAssets.push(STORYBOOK_SEEDLING_CART);
storybookRoadAssets.push(tradeWheelAsset, ...Object.values(tradeCartBodies));
storybookRoadAssets.push(foundingCartBody);
storybookRoadAssets.push(foundingPullAsset, foundingPullRestAsset);
storybookRoadAssets.push(STORYBOOK_EARTHWORK);
storybookRoadAssets.push(STORYBOOK_HERB, STORYBOOK_MOSS);
storybookRoadAssets.push(...storybookRoadHeroIds.map(earthworkAsset));
storybookRoadAssets.push(STORYBOOK_WAREHOUSE);
storybookRoadAssets.push("/storybook-study/town-shop-landmark-v1.webp");
storybookRoadAssets.push(STORYBOOK_HILL_TOWER);
storybookRoadAssets.push(...Object.values(picnicAssets));
storybookRoadAssets.push(
  "/storybook-study/lico-notebook-walk-ponytail-v1.webp",
  "/storybook-study/lico-transplant-care-v1.webp",
  "/storybook-study/loading-basket-v1.webp",
);
storybookRoadAssets.push("/storybook-study/return-cart-v1.webp");
storybookRoadAssets.push(
  "/storybook-study/garden-handcart-v2.webp",
  "/storybook-study/basket-v1.webp",
  "/storybook-study/shipping-record-v1.webp",
);
storybookRoadAssets.push(
  "/storybook-study/aria-night-handheld-v1.webp",
  "/storybook-study/aria-forest-handheld-v1.webp",
  "/storybook-study/aria-night-battle-v1.webp",
  "/storybook-study/moss-jar-v1.webp",
  "/storybook-study/night-lantern-v1.webp",
);
storybookRoadAssets.push(
  "/storybook-study/handcart-raised-v1.webp",
  "/storybook-study/homeward-worker-v1.webp",
);
storybookRoadAssets.push(
  ...["leon", "mira"].map((id) => `/storybook-study/${id}-handheld-v1.webp`),
);
storybookRoadAssets.push("/storybook-study/finn-handheld-balanced-v2.webp");
storybookRoadAssets.push("/storybook-study/leon-recover-offer-v1.webp");
storybookRoadAssets.push("/storybook-study/finn-recover-offer-v1.webp");
storybookRoadAssets.push(
  "/storybook-study/homeward-bottles-v1.webp",
  "/storybook-study/homeward-medicine-v1.webp",
  "/storybook-study/workshop-landmark-v1.webp",
  "/storybook-study/signpost-v1.webp",
);

export function applyStorybookHandheldPose(
  image: Phaser.GameObjects.Image,
  hero: Traveller,
  item: HandheldItem | undefined,
  frame: number,
  size: number,
) {
  if (!item) return false;
  if (item.phase === "ground") return returningHandheldPose(image, hero, item, frame, size);
  if (item.kind === "transplant-basket") return transplantBasketPose(image, frame, size);
  if (item.kind === "bread-parcel") {
    const pose = picnicLeonPose(frame);
    applyStorybookFrame(image, pose.asset, pose.frame, size, pose.cell);
    return true;
  }
  applyStorybookFrame(
    image,
    item.kind === "forest-moss-jar"
      ? "/storybook-study/aria-forest-handheld-v1.webp"
      : hero.id === "finn"
        ? "/storybook-study/finn-handheld-balanced-v2.webp"
        : `/storybook-study/${hero.id}-${hero.id === "aria" ? "night-handheld" : "handheld"}-v1.webp`,
    frame,
    size,
    192,
    2,
  );
  return true;
}
function transplantBasketPose(image: Phaser.GameObjects.Image, frame: number, size: number) {
  const crouching = frame === 1 || frame === 2;
  applyStorybookFrame(
    image,
    crouching
      ? "/storybook-study/lico-transplant-care-v1.webp"
      : "/storybook-study/lico-notebook-walk-ponytail-v1.webp",
    crouching ? (frame === 1 ? 4 : 5) : frame,
    size,
    192,
    2,
  );
  return true;
}
function returningHandheldPose(
  image: Phaser.GameObjects.Image,
  hero: Traveller,
  item: HandheldItem,
  frame: number,
  size: number,
) {
  if (!item.returning) return false;
  if (item.kind === "forest-moss-jar")
    return applyStorybookRoadPose(
      image,
      hero.id,
      hero.walking ? `walk-${String(frame % 4)}` : "8",
      size,
    );
  if (item.kind === "moss-jar" || item.kind === "lunch-bag" || item.kind === "field-basket") {
    applyStorybookFrame(
      image,
      "/storybook-study/aria-night-handheld-v1.webp",
      hero.walking ? 4 + (frame % 4) : 0,
      size,
      192,
      2,
    );
    return true;
  }
  return applyStorybookRoadPose(
    image,
    hero.id,
    hero.walking ? `walk-${String(frame % 4)}` : "8",
    size,
  );
}

/** Only registered poses are replaced; work and battle retain their existing art. */
export function applyStorybookRoadPose(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  pose: string,
  size: number,
) {
  if (!storybookRoadHeroIds.includes(id)) return false;
  const battleFrame = paintedBattleFrame(pose);
  if (battleFrame !== undefined) {
    applyStorybookFrame(image, battleAsset(id), battleFrame, size, 256);
    return true;
  }
  const walking = pose.startsWith("walk-");
  if (!walking && pose !== "8" && pose !== "12") return false;
  const key = asset(id, walking);
  const frame = walking ? Number(pose.slice(5)) % 4 : 0;
  applyStorybookFrame(image, key, frame, size);
  return true;
}

function paintedBattleFrame(pose: string) {
  if (pose === "11") return 3;
  return { "4": 1, "5": 2, "6": 2, "7": 0 }[pose];
}

export function applyNightBattlePose(image: Phaser.GameObjects.Image, pose: string, size: number) {
  const frame = paintedBattleFrame(pose);
  if (frame === undefined) return false;
  applyStorybookFrame(image, "/storybook-study/aria-night-battle-v1.webp", frame, size, 256);
  return true;
}

export function applyStorybookWork(
  image: Phaser.GameObjects.Image,
  id: Traveller["id"],
  kind: string,
  frame: number,
  size: number,
  override?: string,
) {
  const key =
    override ??
    (kind === "inspect"
      ? asset(id, false)
      : kind === "gather"
        ? earthworkAsset(id)
        : workAssets[`${id}:${kind}`]);
  if (!key) return false;
  const selected = kind === "inspect" ? 1 + (frame % 2) : kind === "pack" ? 1 + (frame % 2) : frame;
  applyStorybookFrame(image, key, selected, size);
  return true;
}

export function applyStorybookFrame(
  image: Phaser.GameObjects.Image,
  key: string,
  frame: number,
  size: number,
  cellWidth = 192,
  rows = 1,
) {
  const texture = image.scene.textures.get(key);
  if (!texture.has("0")) {
    for (let frame = 0; frame < 4 * rows; frame++)
      texture.add(
        String(frame),
        0,
        (frame % 4) * cellWidth,
        Math.floor(frame / 4) * 192,
        cellWidth,
        192,
      );
    texture.setFilter(1);
  }
  image
    .setTexture(key, String(frame))
    .setOrigin(96 / cellWidth, 176 / 192)
    // One scale across both characters preserves their authored height difference.
    .setScale((size * 0.9) / 144);
}
