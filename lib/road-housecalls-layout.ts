import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
import type { RoadLook } from "./road-look.ts";
import { lanternRoadLayout } from "./road-lantern-layout.ts";
import { brekkaLedgerLayout } from "./road-brekka-ledger-layout.ts";
import { mossBedsLayout } from "./road-moss-beds-layout.ts";
export const firstChapterReturn = (look?: RoadLook) =>
  !!(look?.forestReturn?.scene || look?.waterwaySearchReturn?.scene);
export const firstChapterReturnFade = (look: RoadLook) =>
  look.waterwaySearchReturn?.fade ?? look.forestReturn?.fade ?? 0;
const returnLayout = (look?: RoadLook) => firstChapterReturn(look) || !!look?.foundation;
export const usesHousecallsLayout = (look?: RoadLook) =>
  returnLayout(look) ||
  [
    look?.housecalls,
    look?.lindeDelivery,
    look?.lanternRoad,
    look?.brekkaLedger,
    look?.mossTrail,
    look?.mossBeds,
    look?.berneCalls,
    look?.manorDelivery,
    look?.manorSurvey,
    look?.gardenReception,
    look?.nightBridge,
    look?.restoration,
    look?.stoneSelection,
  ].some(Boolean);
export const housecallsAssets = {
  bank: "/storybook-study/housecalls-courtyard-v1.png",
  parent: "/storybook-study/household-parent-v1.webp",
  cook: "/storybook-study/household-cook-v1.webp",
  parcel: "/storybook-study/medicine-packet-v1.webp",
  bucket: "/storybook-study/household-water-bucket-v1.webp",
  bottles: "/storybook-study/homeward-bottles-v1.webp",
  bag: "/storybook-study/packing-bag-close-3-v1.webp",
  box: "/storybook-study/homeward-medicine-v1.webp",
  leonCarry: "/storybook-study/leon-carry-v1.webp",
  leonWalk: "/storybook-study/leon-carry-walk-v1.webp",
  leonLower: "/storybook-study/leon-work-v1.webp",
  ariaCarry: "/storybook-study/aria-night-handheld-v1.webp",
  ariaLower: "/storybook-study/aria-work-v1.webp",
  paper: "/storybook-study/leon-paper-v1.webp",
};
export const housecallDoors = [
  { x: 320, y: 440 },
  { x: 740, y: 330 },
  { x: 1290, y: 550 },
];
export const housecallTable = { x: 965, y: 460 };
export const housecallWell = { x: 245, y: 675 };
/** Show the entire connected courtyard; every object shares this source scale. */
export function housecallsLayout(
  view: RoadViewport,
  camera?: { zoom: number; focusX: number; focusY: number },
) {
  const scale = Math.min(view.width / 1536, view.height / 1024) * (camera?.zoom ?? 1);
  const backdrop = {
    x: camera ? view.width / 2 - camera.focusX * scale : (view.width - 1536 * scale) / 2,
    y: camera ? view.height / 2 - camera.focusY * scale : (view.height - 1024 * scale) / 2,
    width: 1536 * scale,
    height: 1024 * scale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + x * scale,
    y: backdrop.y + y * scale,
  });
  const unproject = (x: number, y: number) => ({
    x: (x - backdrop.x) / scale,
    y: (y - backdrop.y) / scale,
  });
  const world = (x: number, y: number) => {
    const p = project(x, y);
    return {
      x: (p.x - roadX(0, 0, view.width)) / roadScale(view.width),
      lane: 0.68 + (p.y - view.height * 0.62) / roadDepth(view.width, view.height),
    };
  };
  const figureSize = 144 * scale;
  return {
    scale,
    backdrop,
    project,
    unproject,
    world,
    figureSize,
    figureRatio: figureSize / roadHeroSize(view.width, view.height),
  };
}

/** Keep the courtyard action readable on a tall screen while retaining its entrances and props. */
export function manorDeliveryLayout(view: RoadViewport) {
  const portrait = Math.max(0, Math.min(1, (view.height / view.width - 1) / 0.35));
  return housecallsLayout(view, { zoom: 1 + 0.25 * portrait, focusX: 768, focusY: 512 });
}

/** The tower investigation also keeps its whole work area visible on tall screens. */
export function foundationLayout(view: RoadViewport) {
  return manorDeliveryLayout(view);
}

/** Move closer on narrow screens while keeping both entrances and the cast in view. */
export function lindeDeliveryLayout(view: RoadViewport, portrait = view.height > view.width) {
  if (portrait) return lindePortraitLayout(view);
  const base = Math.min(view.width / 1536, view.height / 1024);
  const closer = 1 + 0.3 * Math.max(0, Math.min(1, (700 - view.width) / 350));
  const zoom = Math.max(closer, view.width / (1536 * base), view.height / (1024 * base));
  const scale = base * zoom;
  const halfX = view.width / (2 * scale),
    halfY = view.height / (2 * scale);
  const focusX = Math.max(halfX, Math.min(1536 - halfX, 768));
  const focusY = Math.max(halfY, Math.min(1024 - halfY, 610));
  return housecallsLayout(view, { zoom, focusX, focusY });
}

/** The portrait art recomposes the same two doorways, preserving their spatial order. */
function lindePortraitLayout(view: RoadViewport) {
  const scale = Math.max(view.width / 1024, view.height / 1536);
  const backdrop = {
    x: (view.width - 1024 * scale) / 2,
    y: (view.height - 1536 * scale) / 2,
    width: 1024 * scale,
    height: 1536 * scale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + (320 + (x - 600) * 0.94) * scale,
    y: backdrop.y + (520 + (y - 425) * 1.35) * scale,
  });
  const unproject = (x: number, y: number) => ({
    x: 600 + ((x - backdrop.x) / scale - 320) / 0.94,
    y: 425 + ((y - backdrop.y) / scale - 520) / 1.35,
  });
  const world = (x: number, y: number) => {
    const p = project(x, y);
    return {
      x: (p.x - roadX(0, 0, view.width)) / roadScale(view.width),
      lane: 0.68 + (p.y - view.height * 0.62) / roadDepth(view.width, view.height),
    };
  };
  const figureSize = 144 * scale;
  return {
    scale,
    backdrop,
    project,
    unproject,
    world,
    figureSize,
    figureRatio: figureSize / roadHeroSize(view.width, view.height),
  };
}

export function housecallsSceneLayout(view: RoadViewport, look?: RoadLook) {
  if (look?.waterwaySearchReturn?.scene) return foundationLayout(view);
  if (look?.forestReturn?.scene) return foundationLayout(view);
  if (look?.manorDelivery) return manorDeliveryLayout(view);
  if (look?.foundation) return foundationLayout(view);
  return otherHousecallsSceneLayout(view, look);
}

function otherHousecallsSceneLayout(view: RoadViewport, look?: RoadLook) {
  return look?.mossBeds
    ? mossBedsLayout(view)
    : look?.brekkaLedger || look?.mossTrail
      ? brekkaLedgerLayout(view, look.brekkaLedger?.portrait ?? look.mossTrail?.portrait)
      : look?.lanternRoad
        ? lanternRoadLayout(view, look.lanternRoad.portrait)
        : look?.lindeDelivery
          ? lindeDeliveryLayout(view, look.lindeDelivery.portrait)
          : housecallsLayout(view);
}

/** A closer portrait camera keeps the bridge and the travellers in the same scene scale. */
export function nightBridgeLayout(view: RoadViewport, section = 0) {
  if (view.height <= view.width) {
    const zoom = Math.max(1, view.width / view.height / 1.5);
    if (zoom === 1) return housecallsLayout(view);
    const scale = view.width / 1536;
    return housecallsLayout(view, {
      zoom,
      focusX: 768,
      focusY: 1024 - view.height / (2 * scale),
    });
  }
  const portrait = Math.min(1, (view.height / view.width - 1) / 0.4);
  const zoom = 1 + (section === 2 ? 0.2 : 0.5) * portrait;
  const focusX = section === 2 ? 660 : 780;
  return housecallsLayout(view, {
    zoom,
    focusX: 768 + (focusX - 768) * portrait,
    focusY: 512 + 128 * portrait,
  });
}

/** Center the wide backdrop while keeping the cast clear of the dialogue overlay. */
export function nightBridgeBackdrop(view: RoadViewport, section = 0) {
  const backdrop = nightBridgeLayout(view, section).backdrop;
  return view.width / view.height > 1.5
    ? { ...backdrop, y: (view.height - backdrop.height) / 2 }
    : backdrop;
}

/** Reserve only the bench's legs on the ground; hands may reach its top. */
export function housecallObstacles(view: RoadViewport) {
  const l = housecallsLayout(view),
    p = l.project(960, 505);
  return [
    {
      x: (p.x / view.width) * 560,
      lane: l.world(960, 505).lane,
      clearance: {
        x: ((115 * l.scale) / view.width) * 560,
        lane: (28 * l.scale) / roadDepth(view.width, view.height),
      },
    },
  ];
}
