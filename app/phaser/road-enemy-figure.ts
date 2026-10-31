import type Phaser from "phaser";
import type { RoadEnemy, RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/road-look";
import { roadFigureDepth, roadHeroSize } from "@/lib/road-layout";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import {
  adventureEnemyArt,
  storybookWolfAsset,
  storybookSlimeAsset,
} from "@/lib/adventure-enemy-art";
import { RoadStorybookEnemies } from "@/lib/road-storybook-enemy";
import { fitPaintedEnemy } from "./road-storybook-enemy";
import { seedlingBattleAssets } from "@/lib/road-seedling-battle";
import { enemyAppearance, enemyFacesRight, enemyAngle, fitEnemy } from "./road-enemy-appearance";
import type { RoadSpriteFilter } from "./road-sprite-filter";

type View = { width: number; height: number };
const isSeedlingEnemy = (look: RoadLook | undefined, enemy: RoadEnemy) =>
  !!look?.mossBeds?.seedlings && (enemy.kind === "merrill" || enemy.kind === "mushroom");
function merrillBattleFrame(enemy: RoadEnemy, time: number, reduced: boolean) {
  if (enemy.action === "summon") return 1;
  if (enemy.action !== "song") return 0;
  return reduced ? 2 : 2 + (Math.floor((time - (enemy.actionAt ?? time)) / 300) % 2);
}
function paintRecordsDevice(
  image: Phaser.GameObjects.Image,
  enemy: RoadEnemy,
  look: RoadLook | undefined,
  view: View,
  size: number,
  x: number,
  y: number,
) {
  if (!look?.mossBeds?.records || enemy.kind !== "lico") return false;
  image
    .setTexture("/storybook-study/field-reflector-v1.webp")
    .setOrigin(0.5, 1)
    .setPosition(x, y)
    .setDisplaySize(size, size)
    .setFlipX(false)
    .setAngle(0)
    .setTint(0xffffff)
    .setAlpha(enemy.alpha ?? 1)
    .setDepth(roadFigureDepth(enemy.lane, view, look));
  return true;
}
export class RoadEnemyFigures {
  private motion = new RoadStorybookEnemies();
  private filter: RoadSpriteFilter;
  constructor(filter: RoadSpriteFilter) {
    this.filter = filter;
  }

  paint(
    image: Phaser.GameObjects.Image,
    enemy: RoadEnemy,
    state: RoadBattle,
    look: RoadLook | undefined,
    view: View,
    size: number,
    x: number,
    y: number,
    reduced: boolean,
  ) {
    if (paintRecordsDevice(image, enemy, look, view, size, x, y)) return;
    if (isSeedlingEnemy(look, enemy)) {
      this.paintSeedlingEnemy(image, enemy, state, look, view, size, x, y, reduced);
      return;
    }
    const painted = look?.storybookHeroes
      ? this.motion.pose(
          enemy,
          state,
          { width: view.width, height: view.height, stage: state.stage },
          reduced,
          look.sceneKey,
        )
      : undefined;
    const bounce = painted ? 0 : legacyBounce(enemy, state.time, reduced);
    const { asset, frame } = painted ?? enemyAppearance(enemy, look);
    if (!painted && (image.texture.key !== asset || image.frame.name !== frame))
      image.setTexture(asset, frame);
    image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(enemyFlip(enemy, state.heroes[0].x))
      .setAngle(enemyAngle(enemy, state.time, reduced))
      .setTint(look?.night ? 0xd1d1d1 : 0xffffff)
      .setAlpha(enemy.alpha ?? 1)
      .setDepth(roadFigureDepth(enemy.lane, view, look));
    if (painted) fitPaintedEnemy(image, painted, size);
    else fitEnemy(image, enemy, size, state.time, reduced);
    this.applyFilter(image, asset, !!painted, view, size);
  }
  private paintSeedlingEnemy(
    image: Phaser.GameObjects.Image,
    enemy: RoadEnemy,
    state: RoadBattle,
    look: RoadLook | undefined,
    view: View,
    size: number,
    x: number,
    y: number,
    reduced: boolean,
  ) {
    if (enemy.kind === "mushroom")
      image
        .setTexture(
          enemy.pose === "fallen"
            ? seedlingBattleAssets.korotakeRest
            : seedlingBattleAssets.korotake,
        )
        .setOrigin(0.5, 248 / 256)
        .setScale(size / 232);
    else {
      const frame = merrillBattleFrame(enemy, state.time, reduced);
      fitPaintedEnemy(
        image,
        {
          asset: seedlingBattleAssets.merrillBattle,
          frame: String(frame),
          cell: 128,
          rows: 1,
          foot: 120,
          height: 84,
        },
        size,
      );
    }
    image
      .setPosition(x, y)
      .setFlipX(enemyFlip(enemy, state.heroes[0].x))
      .setAngle(0)
      .setTint(0xffffff)
      .setAlpha(enemy.alpha ?? 1)
      .setDepth(roadFigureDepth(enemy.lane, view, look));
    this.filter.apply(image);
  }
  private applyFilter(
    image: Phaser.GameObjects.Image,
    asset: string,
    painted: boolean,
    view: View,
    size: number,
  ) {
    if (painted || [storybookWolfAsset, storybookSlimeAsset].includes(asset))
      this.filter.apply(image);
    else {
      const cellSize = (size * adventureEnemyArt.cell) / adventureEnemyArt.height;
      this.filter.applyPixel(image, roadHeroSize(view.width, view.height) * 0.9, {
        width: cellSize,
        height: cellSize,
      });
    }
  }
}
function legacyBounce(enemy: RoadEnemy, time: number, reduced: boolean) {
  return reduced || enemy.pose === "fallen"
    ? 0
    : Math.sin(time / 170 + enemy.id) * 3 * RPG_CAMERA_SCALE;
}
function enemyFlip(enemy: RoadEnemy, heroX: number) {
  const right = enemyFacesRight(enemy, heroX);
  return enemy.kind === "slime" || ["pumpety", "puppet", "golem"].includes(enemy.kind)
    ? right
    : !right;
}
