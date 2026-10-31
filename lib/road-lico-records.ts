import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { mossBedsLayout, fieldCastScale } from "./road-moss-beds-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { recordsContactTarget } from "./road-lico-contacts.ts";
import { recordsPoint } from "./road-lico-positions.ts";
export { recordsPoint } from "./road-lico-positions.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
const art = {
  lico: "/storybook-study/lico-conversation-ponytail-v1.webp",
  reflector: "/storybook-study/field-reflector-v1.webp",
  reflectorDown: "/storybook-study/field-reflector-down-v1.webp",
  samples: "/storybook-study/field-samples-v1.webp",
  smoke: "/story-stage/prop-low-smoke.webp",
};
export const licoRecordsSceneryAssets = {
  keeper: "/storybook-study/keeper-poses-v1.webp",
  stool: "/storybook-study/bed-stool-v1.webp",
  lapBoard: "/storybook-study/field-lap-board-v1.webp",
  cover: "/storybook-study/field-cover-flat-v1.webp",
  closedLedger: "/storybook-study/field-closed-ledger-v1.webp",
  sit: "/storybook-study/lico-records-sit-transition-v1.webp",
  seated: "/storybook-study/lico-field-records-ponytail-v1.webp",
  basket: "/storybook-study/field-basket-v1.webp",
  medicine: "/storybook-study/visiting-satchel-v1.webp",
  paper: "/storybook-study/shipping-record-v1.webp",
};

export function presentLicoRecords(
  frame: Frame,
  input: AdventureInput,
  view: RoadViewport,
  bank: string,
) {
  const { battle, look } = frame;
  if (!look.storybookHeroes || input.backgroundOverride !== bank) return;
  look.mossBeds = {
    records: true,
    recordsClosing: input.recordsClosing,
    node: input.squad.run?.node ?? 14,
    completed: !input.squad.run,
    recordsDialogue: input.recordsDialogue,
  };
  Object.assign(look, {
    background: bank,
    backgroundShade: 0,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  const l = mossBedsLayout(view),
    beforeHeroes = battle.heroes,
    beforeEnemies = battle.enemies;
  battle.distance = 0;
  battle.stage = "forest";
  battle.heroes = beforeHeroes.map((hero) => ({
    ...hero,
    ...l.world(
      ...(recordsContactTarget(
        hero.id,
        battle,
        input.recordsClosing ? undefined : input.recordsDialogue,
        l.portrait,
      ) ?? recordsHeroPoint(hero.id, battle, l.portrait)),
    ),
    facing: 1,
    walking: false,
  }));
  battle.enemies = beforeEnemies.map((enemy) => ({
    ...enemy,
    ...l.world(...recordsPoint("reflector", l.portrait)),
    facing: -1,
  }));
  battle.effects = remapFixedEffects(battle, beforeHeroes, beforeEnemies);
  if (input.recordsClosing) {
    battle.enemies = [];
    battle.effects = [];
  }
  if (battle.gathering && look.work)
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: art.reflector,
    });
}

export function remapFixedEffects(
  battle: RoadBattle,
  beforeHeroes: RoadBattle["heroes"],
  beforeEnemies: RoadBattle["enemies"],
) {
  return battle.effects.map((effect) => {
    const targetHero = beforeHeroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    const sourceHero = beforeHeroes.findIndex(
      (h) => h.x === effect.fromX && h.lane === effect.fromLane,
    );
    const targetEnemy = beforeEnemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    const sourceEnemy = beforeEnemies.findIndex(
      (e) => e.x === effect.fromX && e.lane === effect.fromLane,
    );
    return {
      ...effect,
      ...(targetHero >= 0
        ? { x: battle.heroes[targetHero].x, lane: battle.heroes[targetHero].lane }
        : {}),
      ...(sourceHero >= 0
        ? { fromX: battle.heroes[sourceHero].x, fromLane: battle.heroes[sourceHero].lane }
        : {}),
      ...(targetEnemy >= 0
        ? { x: battle.enemies[targetEnemy].x, lane: battle.enemies[targetEnemy].lane }
        : {}),
      ...(sourceEnemy >= 0
        ? { fromX: battle.enemies[sourceEnemy].x, fromLane: battle.enemies[sourceEnemy].lane }
        : {}),
    };
  });
}

function recordsHeroPoint(
  id: TravellerId,
  battle: RoadBattle,
  portrait: boolean,
): [number, number] {
  const point = recordsPoint(id, portrait);
  const action = battle.effects.findLast(
    (effect) =>
      effect.hero === id &&
      ["slash", "arrow", "magic"].includes(effect.kind) &&
      battle.time - effect.at >= 0 &&
      battle.time - effect.at < 900,
  );
  if (!action || !battle.enemies.some((enemy) => enemy.kind === "lico" && enemy.hp > 0))
    return point;
  // Step toward the apparatus, remaining in the open path outside the planted beds.
  const device = recordsPoint("reflector", portrait);
  return [
    point[0] + Math.sign(device[0] - point[0]) * 35,
    point[1] + Math.sign(device[1] - point[1]) * 35,
  ];
}

export function prepareLicoRecords(frame: Frame, view: RoadViewport, closingMs = 0): Frame {
  const closing = !!frame.look.mossBeds?.recordsClosing;
  const activeEnemy =
    !closing && frame.battle.enemies.some((enemy) => enemy.kind === "lico" && enemy.hp > 0);
  const disabled =
    closing ||
    !!frame.look.mossBeds?.completed ||
    frame.battle.enemies.some((enemy) => enemy.kind === "lico" && enemy.hp <= 0);
  const props = recordsProps(frame, view, activeEnemy, disabled, closing ? closingMs : 0);
  const actors = recordsActors(view, closing, activeEnemy, closingMs);
  return {
    ...frame,
    battle: {
      ...frame.battle,
      waterwayActions: { poses: {}, props, actors, debrisHidden: true, closeContact: true },
    },
  };
}

function recordsProps(
  frame: Frame,
  view: RoadViewport,
  activeEnemy: boolean,
  disabled: boolean,
  closingMs: number,
) {
  const l = mossBedsLayout(view);
  const props = (activeEnemy ? ["samples"] : ["reflector", "samples"]).map((id) => {
    const kind = id as "reflector" | "samples";
    return housecallProp(
      view,
      id,
      kind === "reflector" && disabled ? art.reflectorDown : art[kind],
      l.world(...recordsPoint(kind, l.portrait)),
      kind === "reflector" ? 125 : 95,
      l.scale,
    );
  });
  props.push(...recordsFurniture(view, closingMs));
  if (activeEnemy) {
    const device = recordsPoint("reflector", l.portrait);
    const smoke = housecallProp(
      view,
      "low-smoke",
      art.smoke,
      l.world(device[0] - (l.portrait ? 45 : 70), device[1] + (l.portrait ? 35 : 55)),
      340,
      l.scale,
    );
    smoke.alpha = frame.battle.enemies.some((enemy) => enemy.action === "paralyze") ? 0.7 : 0.32;
    props.push(smoke);
  }
  return props;
}

// These objects are already present when the party reaches the beds.
function recordsFurniture(view: RoadViewport, closingMs: number) {
  const l = mossBedsLayout(view);
  const props = [];
  for (const [id, asset, wide, tall, width] of [
    ["lico-stool", licoRecordsSceneryAssets.stool, [989, 726], [660, 733], 80],
    ["lap-board", licoRecordsSceneryAssets.lapBoard, [823, 841], [548, 815], 102],
    ["reflector-cover", licoRecordsSceneryAssets.cover, [602, 505], [401, 585], 133],
    ["lico-book", licoRecordsSceneryAssets.closedLedger, [1017, 711], [678, 720], 35],
    ["records", licoRecordsSceneryAssets.closedLedger, [976, 711], [651, 720], 46],
  ] as const) {
    if (id === "lico-book" && closingMs >= 1450) continue;
    const [x, y] = recordsFurniturePoint(id, l.portrait ? tall : wide, l.portrait, closingMs);
    const point = l.world(x, y);
    const prop = housecallProp(view, id, asset, point, width, l.scale);
    if (id === "lico-stool") prop.depth = point.lane - 0.2;
    props.push(prop);
  }
  return props;
}

function recordsFurniturePoint(
  id: string,
  point: readonly [number, number],
  portrait: boolean,
  elapsed: number,
) {
  if (id === "lico-book" && elapsed > 900) {
    const end = portrait ? [663, 695] : [992, 680];
    const t = Math.min(1, (elapsed - 900) / 550);
    return [point[0] + (end[0] - point[0]) * t, point[1] + (end[1] - point[1]) * t];
  }
  if (id === "records" && elapsed > 0) {
    const end = portrait ? [606, 773] : [908, 789];
    const t = Math.min(1, elapsed / 1000);
    return [point[0] + (end[0] - point[0]) * t, point[1] + (end[1] - point[1]) * t * t];
  }
  return point;
}

function recordsActors(
  view: RoadViewport,
  closing: boolean,
  activeEnemy: boolean,
  closingMs: number,
) {
  const l = mossBedsLayout(view),
    starting = recordsPoint("lico", l.portrait);
  const seat = l.portrait ? [659, 725] : [988, 718];
  const travel = closing ? Math.min(1, closingMs / 900) : 0;
  const licoPoint = l.world(
    starting[0] + (seat[0] - starting[0]) * travel,
    starting[1] + (seat[1] - starting[1]) * travel,
  );
  const licoPose = recordsLicoPose(closing, activeEnemy, closingMs);
  return [
    {
      id: "lico-at-beds",
      point: licoPoint,
      size: l.figureRatio * fieldCastScale(l.portrait),
      facing: closing && closingMs < 900 ? (1 as const) : (-1 as const),
      pose: licoPose,
    },
    {
      id: "keeper-at-beds",
      point: l.portrait ? l.world(763, 630) : l.world(1144, 594),
      size: l.figureRatio * 0.85 * fieldCastScale(l.portrait),
      facing: 1 as const,
      pose: {
        asset: licoRecordsSceneryAssets.keeper,
        frame: 0,
        cell: 128,
        rows: 1,
        square: { foot: 120, height: 94 },
      },
    },
  ];
}

function recordsLicoPose(closing: boolean, activeEnemy: boolean, closingMs: number) {
  if (!closing) return { asset: art.lico, frame: activeEnemy ? 2 : 0 };
  if (closingMs < 900)
    return {
      asset: "/storybook-study/lico-walk-ponytail-v2.webp",
      frame: Math.floor(closingMs / 180) % 4,
    };
  if (closingMs < 1450)
    return { asset: licoRecordsSceneryAssets.sit, frame: closingMs < 1175 ? 1 : 2 };
  return { asset: licoRecordsSceneryAssets.seated, frame: 4, rows: 2 };
}
