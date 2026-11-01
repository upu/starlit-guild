import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayBackgrounds, waterwayLayout } from "./road-waterway-layout.ts";
import { arrangeStorybookForage } from "./road-storybook-work.ts";
import { mossRemovalAssets } from "./road-moss-removal-layout.ts";
import { mossHatchOffset } from "./road-moss-hatch-layout.ts";
import { waterwaySearchAssets, waterwaySearchFeet } from "./road-waterway-search.ts";

export const WATERWAY_TOOL_CART = "/storybook-study/waterway-tool-cart-v1.webp";
export const WATERWAY_WORKER = "/storybook-study/waterway-worker-v1.webp";
export const WATERWAY_BRANCHES = "/storybook-study/waterway-branches-v1.webp";
export function waterwayWorkerFrame(
  node: number,
  time: number,
  reduced: boolean,
  fighting: boolean,
) {
  if (node === 8) return 3;
  if (node < 4 || node > 7) return 0;
  // Pause with the saw still held when the guards are fighting.
  return 1 + (reduced || fighting ? 0 : Math.floor(time / 450) % 2);
}
type Frame = { battle: RoadBattle; look: RoadLook };
const supportedWaterwayBackgrounds = new Set<string>([
  ...Object.values(waterwayBackgrounds),
  mossRemovalAssets.bank,
  waterwaySearchAssets.bank,
]);
const mossEnemyFeet = [
  [520, 640],
  [380, 480],
  [710, 470],
];
const searchEnemyFeet = [
  [560, 680],
  [610, 500],
  [760, 560],
];
const restorationEnemyFeet = [
  [520, 720],
  [400, 570],
  [400, 850],
];
// Dry-side feet in source-art pixels. The inset hatch and flowing channel stay to the right.
const feet: [number, number, number, number][] = [
  [650, 720, 810, 740],
  [600, 740, 780, 735],
  [650, 740, 810, 740],
  [600, 740, 780, 735],
  [950, 510, 1060, 540],
  [990, 735, 830, 745],
  [600, 740, 780, 735],
  [990, 720, 850, 730],
  [1020, 600, 840, 550],
  [1040, 735, 880, 745],
  [990, 735, 850, 745],
  [925, 570, 1050, 550],
  [990, 690, 830, 735],
  [1020, 530, 880, 500],
  [1040, 735, 880, 745],
];

/** Project rendering only; the original combat, quest progress and saves remain authoritative. */
export function presentWaterway(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    !["old-waterway", "tower-restoration", "tower-moss-removal"].includes(look.quest ?? "") ||
    !supportedWaterwayBackgrounds.has(input.backgroundOverride ?? look.background)
  )
    return;
  const node =
    input.mossFinalizing || input.waterwaySearchFinalizing
      ? 14
      : Math.min(14, input.squad.run?.node ?? (input.questComplete === false ? 0 : 14));
  const moss = look.quest === "tower-moss-removal";
  const search = look.quest === "old-waterway";
  look.waterway = {
    node,
    phase: search ? "blocked" : waterwayPhase(moss, node),
    completed: !input.squad.run && input.questComplete === true,
  };
  look.background = siteBackground(look.quest, look.waterway.phase);
  look.backgroundShade = 0.08;
  look.destination = false;
  const layout = waterwayLayout(view.width, view.height);
  placeActors(
    battle,
    layout,
    siteFeet(
      look.quest,
      node,
      battle.enemies.some((e) => e.hp > 0),
    ),
    moss,
    search,
  );
  if (search) placeSearchWork(frame, layout, node);
  else placeWaterwayWork(frame, layout, view);
}
function siteBackground(quest: string | undefined, phase: keyof typeof waterwayBackgrounds) {
  if (quest === "old-waterway") return waterwaySearchAssets.bank;
  if (quest === "tower-moss-removal") return mossRemovalAssets.bank;
  return waterwayBackgrounds[phase];
}
function siteFeet(quest: string | undefined, node: number, fighting: boolean) {
  if (fighting) return [900, 735, 680, 735];
  if (quest === "old-waterway") return waterwaySearchFeet(node);
  return quest === "tower-moss-removal" ? mossFeet(node) : feet[node];
}
function placeActors(
  battle: RoadBattle,
  layout: ReturnType<typeof waterwayLayout>,
  positions: number[],
  moss: boolean,
  search: boolean,
) {
  const originalHeroes = battle.heroes,
    originalEnemies = battle.enemies;
  const fighting = battle.enemies.some((enemy) => enemy.hp > 0);
  battle.distance = 0;
  battle.heroes = originalHeroes.map((hero) => ({
    ...hero,
    ...layout.world(positions[hero.id === "aria" ? 0 : 2], positions[hero.id === "aria" ? 1 : 3]),
    walking: false,
    facing: fighting ? -1 : 1,
  }));
  const enemyFeet = search ? searchEnemyFeet : moss ? mossEnemyFeet : restorationEnemyFeet;
  battle.enemies = originalEnemies.map((enemy, index) => ({
    ...enemy,
    ...layout.world(...(enemyFeet[index % enemyFeet.length] as [number, number])),
  }));
  battle.effects = battle.effects.map((effect) => {
    const target = originalEnemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    const source = originalHeroes.findIndex(
      (h) => h.x === effect.fromX && h.lane === effect.fromLane,
    );
    const patient = originalHeroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    return {
      ...effect,
      ...(target >= 0 ? { x: battle.enemies[target].x, lane: battle.enemies[target].lane } : {}),
      ...(patient >= 0 ? { x: battle.heroes[patient].x, lane: battle.heroes[patient].lane } : {}),
      ...(source >= 0
        ? { fromX: battle.heroes[source].x, fromLane: battle.heroes[source].lane }
        : {}),
    };
  });
}
function placeSearchWork(
  { battle, look }: Frame,
  layout: ReturnType<typeof waterwayLayout>,
  node: number,
) {
  if (look.work && battle.gathering) {
    look.work = { ...look.work, frame: "waterway-bank", task: "inspect", cargo: false };
    const site = waterwaySearchFeet(node);
    battle.gathering = {
      ...battle.gathering,
      ...layout.world(site[0] + 65, site[1] + 25),
      task: "inspect",
      kind: "herb",
    };
    look.workers = battle.enemies.some((e) => e.hp > 0) ? [] : ["aria", "leon"];
  }
}

function mossFeet(node: number) {
  const offset = mossHatchOffset(node);
  return [985 + offset.x, 670 + offset.y, 1070 + offset.x, 713 + offset.y];
}
function waterwayPhase(moss: boolean, node: number) {
  if (moss) return node < 2 ? "cleared" : "open";
  return node < 9 ? "blocked" : "cleared";
}
function placeWaterwayWork(
  frame: Frame,
  layout: ReturnType<typeof waterwayLayout>,
  view: RoadViewport,
) {
  const { battle, look } = frame;
  if (!look.work || !battle.gathering || !look.waterway) return;
  const profile = waterwayWorkProfile(
    look.quest === "tower-moss-removal" ? -1 : look.waterway.node,
  );
  const gather = profile.task === "gather",
    cargo = profile.cargo;
  const point = layout.world(gather ? 1035 : 1000, gather ? 720 : 680);
  look.work = {
    ...look.work,
    ...profile,
  };
  battle.gathering = {
    ...battle.gathering,
    ...point,
    x: point.x - 65,
    kind: cargo ? "cargo" : "herb",
    task: look.work.task,
  };
  look.workers = battle.enemies.some((enemy) => enemy.hp > 0) ? [] : ["aria", "leon"];
  if (gather) arrangeStorybookForage(battle, look, view);
}

function waterwayWorkProfile(
  node: number,
): Pick<NonNullable<RoadLook["work"]>, "asset" | "frame" | "cargo" | "task"> {
  if (node === 2) return { asset: WATERWAY_TOOL_CART, frame: "cart", cargo: true, task: "carry" };
  if ([7, 10].includes(node))
    return { asset: WATERWAY_BRANCHES, frame: "waterway-branches", cargo: false, task: "gather" };
  return { asset: WATERWAY_WORKER, frame: "waterway-bank", cargo: false, task: "inspect" };
}
