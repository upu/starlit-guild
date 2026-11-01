import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { roadWorkWidth } from "./road-work-layout.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { berneHandheld, berneJourneyAssets } from "./road-berne-journey.ts";
import { usesHousecallsLayout } from "./road-housecalls-layout.ts";
import { townParcelCheck, townParcelWidth } from "./road-town-parcel.ts";

export const hideFixedWorkProgress = (look: RoadLook) =>
  [
    look.manorDelivery,
    look.stoneSelection,
    look.manorSurvey,
    look.gardenReception,
    look.nightBridge,
    look.restoration,
    look.lindeDelivery,
    look.lanternRoad,
    look.mossBeds,
  ].some(Boolean);

export const STORYBOOK_PARCEL = "/storybook-study/covered-box-v1.webp";
export const STORYBOOK_CART = "/storybook-study/loaded-cart-v1.webp";
export const STORYBOOK_MEDICAL_CART = "/storybook-study/brekka-medical-cart-v1.webp";
export const STORYBOOK_SEEDLING_CART = "/storybook-study/seedling-cart-body-v2.webp";
export const STORYBOOK_EARTHWORK = "/storybook-study/earthwork-patch-v1.webp";
export const STORYBOOK_HERB = "/storybook-study/forage-herb-v1.webp";
export const STORYBOOK_MOSS = "/storybook-study/moss-colony-v1.webp";
export const STORYBOOK_SIGNPOST = "/storybook-study/signpost-v1.webp";
export const STORYBOOK_WORKSHOP = "/storybook-study/workshop-landmark-v1.webp";
const paintedWorkAssets: Record<string, string> = {
  "night-light": "/storybook-study/moss-jar-v1.webp",
  signpost: STORYBOOK_SIGNPOST,
  "hand-bottles": "/storybook-study/homeward-bottles-v1.webp",
  "homeward-route": STORYBOOK_WORKSHOP,
  "passing-cart": "/storybook-study/handcart-raised-v1.webp",
  herb: STORYBOOK_HERB,
  moss: STORYBOOK_MOSS,
  earthwork: STORYBOOK_EARTHWORK,
  parcels: STORYBOOK_PARCEL,
  "berne-medicine": berneJourneyAssets.parcel,
};
const hiddenWorkFrames = new Set([
  "waterway-bank",
  "packing-bench",
  "signpost-restoration",
  "housecalls",
  "berne-medicine",
  "night-light",
]);
export const hiddenHomewardWork = (look: RoadLook) =>
  !!look.storybookHeroes &&
  (hiddenWorkFrames.has(look.work?.frame ?? "") ||
    (look.quest === "medicine-road-home" &&
      ["hand-bottles", "homeward-route", "passing-cart"].includes(look.work?.frame ?? "")));
export const isStorybookForage = (look?: RoadLook) =>
  !!look?.storybookHeroes && ["herb", "moss", "waterway-branches"].includes(look.work?.frame ?? "");
export function groundWorkVisible(state: RoadBattle, look: RoadLook) {
  return (
    !!state.gathering &&
    !look.foundingDraft &&
    !state.waterwayActions?.debrisHidden &&
    !hiddenHomewardWork(look) &&
    !(state.journeyCart && state.gathering.kind === "cargo")
  );
}
export const gatherCrouch = (
  gathering: boolean,
  reduced: boolean,
  time: number,
  look?: RoadLook,
) => (gathering && !reduced && !look?.storybookHeroes ? 4 + Math.sin(time / 280) * 2 : 0);

export const isSeedlingCart = (look?: RoadLook) => !!look?.work?.asset.includes("seedling-cart");

export const usesStorybookCart = (look?: RoadLook) =>
  !!look?.storybookHeroes && (look.work?.frame === "cart" || isSeedlingCart(look));

// The low shafts extend below the wheel: ground contact belongs to the tyre.
export const storybookCartOrigin = (look?: RoadLook) =>
  usesStorybookCart(look) && isSeedlingCart(look) ? 0.91 : 1;

export function roadWorkOrigin(look: RoadLook, cargo: boolean) {
  if (look.work?.frame === "earthwork") return 0.6;
  if (cargo) return storybookCartOrigin(look);
  return look.work?.frame ? 1 : 0.92;
}

export const roadWorkProgressLayout = (
  look: RoadLook,
  size: number,
  imageHeight: number,
  heroSize: number,
) =>
  look.work?.frame === "earthwork"
    ? { size: heroSize * 1.4, offset: imageHeight * 0.4 + 5 }
    : hiddenHomewardWork(look)
      ? { size: heroSize * 0.7, offset: 12 }
      : { size, offset: 5 };

export const roadWorkFlip = (look: RoadLook, point: NonNullable<RoadBattle["gathering"]>) =>
  point.kind === "cargo" &&
  point.task === "carry" &&
  !!look.puller &&
  !usesStorybookCart(look) &&
  look.work?.frame !== "town-parcel";

export function storybookWorkAppearance(look?: RoadLook) {
  if (!look?.storybookHeroes) return;
  if (
    (look.waterway || look.signpost || look.packing || usesHousecallsLayout(look)) &&
    look.work?.asset.startsWith("/storybook-study/")
  )
    return { asset: look.work.asset, frame: "__BASE" };
  const asset = paintedWorkAssets[look.work?.frame ?? ""];
  if (asset) return { asset, frame: "__BASE" };
  if (usesStorybookCart(look))
    return {
      asset: isSeedlingCart(look)
        ? STORYBOOK_SEEDLING_CART
        : look.quest === "brekka-arrival"
          ? STORYBOOK_MEDICAL_CART
          : STORYBOOK_CART,
      frame: "__BASE",
    };
  return undefined;
}

export function prepareStorybookWork(look: RoadLook) {
  const work = look.work;
  if (!look.storybookHeroes || !work) return;
  if (berneHandheld(look)) prepareBerneWork(look, work);
  if (look.quest === "moss-night-road") work.frame = "night-light";
  if (look.quest === "medicine-road-home") prepareHomewardWork(look, work);
  if (work.asset.includes("/herb-v2.")) work.frame = "herb";
  if (work.asset.includes("/work-earthwork-")) work.frame = "earthwork";
}
function prepareBerneWork(look: RoadLook, work: NonNullable<RoadLook["work"]>) {
  work.cargo = false;
  work.frame = "berne-medicine";
  work.asset = berneJourneyAssets.parcel;
  look.puller = null;
  look.frontCarriers = [];
}
function prepareHomewardWork(look: RoadLook, work: NonNullable<RoadLook["work"]>) {
  if (work.cargo) {
    work.cargo = false;
    work.frame = work.task === "carry" ? "hand-bottles" : "passing-cart";
    look.puller = null;
    look.frontCarriers = [];
  }
  if (work.asset.includes("/work-route-")) work.frame = "homeward-route";
}
export function roadWorkFoot(
  point: NonNullable<RoadBattle["gathering"]>,
  heroes: RoadBattle["heroes"],
  look: RoadLook,
) {
  const carrier =
    look.work?.frame === "night-light"
      ? heroes.find((h) => h.id === "aria")
      : look.work?.frame === "hand-bottles"
        ? heroes.find((h) => h.id === "leon")
        : undefined;
  return {
    x: carrier?.x ?? point.x + 65,
    lane: carrier?.lane ?? point.lane ?? (point.kind === "cargo" ? 0.82 : 0.68),
  };
}
export function arrangeHomewardWork(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (
    !look.storybookHeroes ||
    look.quest !== "medicine-road-home" ||
    !battle.gathering ||
    !look.workers.length ||
    battle.enemies.some((e) => e.hp > 0)
  )
    return;
  const center = battle.gathering.x + 65,
    size = roadHeroSize(view.width, view.height),
    scale = roadScale(view.width, battle.stage);
  const carrying = look.work?.frame === "hand-bottles";
  const slots: Partial<Record<RoadBattle["heroes"][number]["id"], [number, number]>> =
    look.work?.frame === "passing-cart"
      ? { aria: [0, 0.17], leon: [0.95, 0.17], mira: [-0.95, 0.17] }
      : carrying
        ? { aria: [1.3, 0.5], leon: [0, 0.9], mira: [-1.2, 0.42] }
        : { aria: [-1, 0.45], leon: [0.9, 0.9], mira: [-2.1, 0.45] };
  for (const hero of battle.heroes) {
    const slot = slots[hero.id];
    if (!slot) continue;
    hero.x = center + (slot[0] * size) / scale;
    hero.lane = slot[1];
    hero.facing = carrying || slot[0] < 0 ? 1 : -1;
  }
}

/** Keep both pairs of boots outside the roots; reaching hands meet the outer leaves. */
export function arrangeStorybookForage(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  const point = battle.gathering;
  if (
    !isStorybookForage(look) ||
    !point ||
    point.task !== "gather" ||
    battle.enemies.some((e) => e.hp > 0)
  )
    return;
  const patch = roadWorkWidth(view.width, false, look.work?.frame, view.height);
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
  for (const hero of battle.heroes) {
    if (!look.workers.includes(hero.id) || !["aria", "leon"].includes(hero.id)) continue;
    const left = hero.id === "aria",
      hand = left ? { x: 45, y: -10 } : { x: 32, y: -7 };
    hero.x =
      point.x +
      65 +
      ((left ? -1 : 1) * (patch * 0.3 + hand.x * figure)) / roadScale(view.width, battle.stage);
    hero.lane =
      (point.lane ?? 0.68) + (-patch * 0.25 - hand.y * figure) / roadDepth(view.width, view.height);
    hero.facing = left ? 1 : -1;
  }
}

export function arrangeStorybookEarthwork(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (look.work?.frame !== "earthwork" || !battle.gathering || battle.enemies.some((e) => e.hp > 0))
    return;
  const size = roadHeroSize(view.width, view.height);
  const order = ["aria", "leon", "mira", "finn", "lico"].filter((id) =>
    battle.heroes.some((h) => h.id === id),
  );
  for (const hero of battle.heroes) {
    if (!look.workers.includes(hero.id)) continue;
    hero.x =
      battle.gathering.x +
      65 +
      ((order.indexOf(hero.id) - (order.length - 1) / 2) * size * 0.85) /
        roadScale(view.width, battle.stage);
    hero.lane = 0.68;
    hero.facing = 1;
  }
}

/** Hand anchors measured in the 192px work strips, relative to (96,176). */
const packHand = (left: boolean) => (left ? { x: 25, y: -35 } : { x: 32, y: -46 });
export function arrangeStorybookPack(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  const point = battle.gathering;
  if (!point || point.task !== "pack" || look.work?.frame !== "parcels") return;
  const town = townParcelCheck(battle, look);
  const parcel = town ? townParcelWidth(view) : roadWorkWidth(view.width, false, "parcels");
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
  const workers = battle.heroes.filter(
    (hero) => look.workers.includes(hero.id) && ["aria", "leon"].includes(hero.id),
  );
  for (const hero of workers) {
    const left = hero.id === "aria";
    const hand = packHand(left);
    const side = left ? -1 : 1;
    hero.x =
      point.x +
      65 +
      (side * (parcel * 0.33 + hand.x * figure)) / roadScale(view.width, battle.stage);
    hero.lane =
      (town ? 0.82 : 0.68) +
      (-parcel * 0.36 - hand.y * figure) / roadDepth(view.width, view.height);
    hero.facing = left ? 1 : -1;
  }
}
