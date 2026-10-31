import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { mossBedsLayout, seedlingCastScale } from "./road-moss-beds-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { remapFixedEffects } from "./road-lico-records.ts";
import { SEEDLING_SCENE_SCALE } from "./seedling-scene-scale.ts";

export const seedlingBattleAssets = {
  yard: "/storybook-study/tower-loading-yard-v1.png",
  yardPortrait: "/storybook-study/tower-loading-yard-portrait-v1.png",
  merrillBattle: "/storybook-study/merrill-battle-v1.webp",
  korotake: "/storybook-study/loading-korotake-v1.webp",
  korotakeRest: "/storybook-study/korotake-rest-v1.webp",
  seedlingBasket: "/storybook-study/loading-basket-v1.webp",
  coveredBasket: "/storybook-study/loading-basket-covered-v1.webp",
};
/** Merrill's 128px frames and the party's 192px frames share a scene cell. */
export function seedlingMerrillHeight(view: RoadViewport) {
  const layout = mossBedsLayout(view);
  return layout.scale * 192 * 0.9 * seedlingCastScale(layout.portrait) * (84 / 128);
}
export const seedlingMushroomHeight = (view: RoadViewport) =>
  mossBedsLayout(view).scale * 36 * SEEDLING_SCENE_SCALE;
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = readonly [number, number];
type Enemy = RoadBattle["enemies"][number];
const wide: Record<TravellerId | "merrill" | "covered" | "open" | "reflector", Point> = {
  aria: [514, 675],
  leon: [711, 799],
  mira: [425, 853],
  finn: [667, 940],
  lico: [910, 697],
  merrill: [1098, 615],
  covered: [635, 579],
  open: [977, 600],
  reflector: [759, 527],
};
const tall: typeof wide = {
  aria: [300, 630],
  leon: [485, 820],
  mira: [250, 860],
  finn: [440, 990],
  lico: [610, 710],
  merrill: [730, 620],
  covered: [400, 570],
  open: [650, 590],
  reflector: [505, 515],
};
const mushrooms: Record<"wide" | "tall", Point[]> = {
  wide: [
    [1027.8912, 785.2032],
    [1080.97536, 785.2032],
    [1134.05952, 785.2032],
    [1187.14368, 785.2032],
  ],
  tall: [
    [621.1667, 820],
    [681.9667, 820],
    [742.7667, 820],
    [803.5667, 820],
  ],
};

function presentEnemy(
  enemy: Enemy,
  point: { x: number; lane: number },
  input: AdventureInput,
): Enemy {
  const closing = !!input.seedlingsClosing;
  const mushroom = enemy.kind === "mushroom";
  const merrill = enemy.kind === "merrill";
  return {
    ...enemy,
    ...point,
    facing: -1,
    ...(closing && mushroom ? { hp: 0 } : {}),
    ...(closing && merrill ? { hp: 1, action: undefined } : {}),
    ...(!closing && merrill && enemy.hp <= 0
      ? { pose: "retreat" as const, action: undefined }
      : {}),
    ...(!closing && merrill && enemy.hp > 0 && input.merrillSinging
      ? { action: "song" as const }
      : {}),
    ...(mushroom && (enemy.hp <= 0 || closing) ? { pose: "fallen" as const } : {}),
  };
}

/** The single Merrill encounter takes place in the same yard as both conversations. */
export function presentSeedlingBattle(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const run = input.squad.run;
  if (!run || !frame.look.storybookHeroes || input.backgroundOverride !== seedlingBattleAssets.yard)
    return;
  if (run.nodes !== 1 && !frame.battle.enemies.some((enemy) => enemy.kind === "merrill")) return;
  const l = mossBedsLayout(view),
    points = l.portrait ? tall : wide;
  const { battle, look } = frame;
  const previousHeroes = battle.heroes,
    previousEnemies = battle.enemies;
  look.mossBeds = { seedlings: true, node: run.node, completed: !!input.seedlingsClosing };
  Object.assign(look, {
    background: seedlingBattleAssets.yard,
    backgroundShade: 0,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  battle.distance = 0;
  battle.stage = "forest";
  battle.heroes = previousHeroes.map((hero) => ({
    ...hero,
    ...l.world(...points[hero.id]),
    facing: 1,
    walking: false,
  }));
  let count = 0;
  battle.enemies = previousEnemies.map((enemy) => {
    const point =
      enemy.kind === "mushroom"
        ? mushrooms[l.portrait ? "tall" : "wide"][count++ % 4]
        : points.merrill;
    return presentEnemy(enemy, l.world(...point), input);
  });
  battle.effects = input.seedlingsClosing
    ? []
    : remapFixedEffects(battle, previousHeroes, previousEnemies);
  const props = [
    ["covered-seedlings", seedlingBattleAssets.coveredBasket, points.covered, 111],
    ["open-seedlings", seedlingBattleAssets.seedlingBasket, points.open, 111],
    ["loading-reflector", "/storybook-study/field-reflector-down-v1.webp", points.reflector, 133],
  ] as const;
  battle.waterwayActions = {
    poses: {},
    debrisHidden: true,
    closeContact: true,
    props: props.map(([id, asset, point, width]) =>
      housecallProp(view, id, asset, l.world(...point), width, l.scale),
    ),
  };
}
