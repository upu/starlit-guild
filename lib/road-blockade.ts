import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, RoadEnemy } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { projectFixedEffects } from "./road-fixed-effects.ts";
import {
  blockadeAssets,
  blockadeFeet,
  blockadeEnemyFoot,
  blockadeGatheredFoot,
  blockadeProps,
} from "./road-blockade-layout.ts";
import { blockadeSceneFoot, blockadeEntryProgress } from "./road-blockade-path.ts";
import { roadHeroSize } from "./road-layout.ts";
import { enemyDisplayHeight } from "./road-enemy-layout.ts";

export function presentBlockade(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "sweet-blockade" ||
    input.backgroundOverride !== blockadeAssets.bank
  )
    return;
  const originalHeroes = battle.heroes.map((h) => ({ ...h })),
    originalEnemies = battle.enemies.map((e) => ({ ...e }));
  const layout = fixedRoadLayout(view.width, view.height),
    front = originalHeroes.find((h) => h.id === "leon") ?? originalHeroes[0];
  look.blockade = {
    node: input.squad.run?.node ?? 2,
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: blockadeAssets.bank,
    backgroundShade: 0.08,
    destination: false,
    puller: null,
    frontCarriers: [],
  });
  battle.stage = "forest";
  battle.distance = 0;
  for (const hero of battle.heroes)
    Object.assign(hero, layout.world(blockadeFeet[hero.id].x, blockadeFeet[hero.id].y), {
      walking: false,
      facing: 1,
    });
  placeEnemies(battle, front.x, view);
  projectFixedEffects(battle, originalHeroes, originalEnemies);
}

function placeEnemies(battle: RoadBattle, frontX: number, view: RoadViewport) {
  let small = 0;
  const layout = fixedRoadLayout(view.width, view.height);
  for (const enemy of battle.enemies) {
    const slot = enemy.kind === "puppet" ? small++ : 0;
    const point = enemyPoint(enemy, slot, battle, frontX);
    Object.assign(enemy, layout.world(point.x, point.y));
  }
}
function enemyPoint(enemy: RoadEnemy, slot: number, battle: RoadBattle, frontX: number) {
  const progress = battle.sceneProgress ?? 0;
  if (!battle.scene) {
    const point = blockadeEnemyFoot(enemy, slot);
    if (enemy.kind !== "pumpety")
      point.x += Math.max(0, Math.min(slot === 1 ? 85 : 170, (enemy.x - frontX - 150) * 0.35));
    return point;
  }
  const point = blockadeSceneFoot(enemy, slot, battle.scene, progress);
  const previous = blockadeSceneFoot(enemy, slot, battle.scene, Math.max(0, progress - 0.001));
  enemy.facing = point.x >= previous.x ? 1 : -1;
  enemy.alpha = sceneAlpha(battle.scene, progress, enemy.kind);
  return point;
}
function sceneAlpha(scene: RoadBattle["scene"], progress: number, kind: RoadEnemy["kind"]) {
  if (scene === "enter") return Math.min(1, blockadeEntryProgress(kind, progress) * 5);
  if (scene === "withdraw") return Math.min(1, (1 - progress) * 5);
  return 1;
}
export function finishBlockade(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (!look.blockade) return;
  battle.waterwayActions ??= { poses: {}, props: [], debrisHidden: true, closeContact: false };
  battle.waterwayActions.props.push(...blockadeProps(view));
  if (!look.blockade.completed) return;
  const layout = fixedRoadLayout(view.width, view.height);
  battle.waterwayActions.actors = (
    [
      ["golem", 5],
      ["puppet", 5],
      ["pumpety", 0],
    ] as const
  ).map(([kind, frame]) => {
    const foot = blockadeGatheredFoot(kind),
      masked = kind === "pumpety";
    return {
      id: `stopped-${kind}`,
      point: layout.world(foot.x, foot.y),
      facing: masked ? 1 : -1,
      size:
        enemyDisplayHeight({ kind, boss: kind === "golem" }, view.width, view.height) /
        roadHeroSize(view.width, view.height),
      pose: {
        asset: blockadeAssets[kind],
        frame,
        cell: masked ? 128 : 512,
        rows: masked ? 3 : 2,
        square: { foot: masked ? 120 : 480, height: masked ? 78 : 384 },
      },
    };
  });
}
