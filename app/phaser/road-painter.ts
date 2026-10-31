import { paintPuppetStrings } from "./road-puppet-strings";
import type { RoadFigure as Figure } from "./road-figure";
import { roadHeroOpacity } from "@/lib/road-injury-pose";
import * as housecalls from "@/lib/road-housecalls-layout";
import { fixedFigureScale } from "@/lib/road-fixed-figure-scale";
import type Phaser from "phaser";
import { paintRoadSceneFade } from "./road-scene-fade";
import {
  gatherCrouch,
  roadWorkProgressLayout,
  groundWorkVisible,
  roadWorkFoot,
  hideFixedWorkProgress,
} from "@/lib/road-storybook-work";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { roadFigureDepth, roadHeroSize, roadX, roadY } from "@/lib/road-layout";
import { roadGatheringAppearance } from "./road-town-parcel";
import { paintGroundWorkImage } from "./road-ground-work-image";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import { RoadScenery } from "./road-scenery";
import { paintRoadHeroPose, faceRoadHero } from "./road-hero-pose";
import { RoadHandheldProps } from "./road-handheld-props";
import { RoadNightLights } from "./road-night-lights";
import { RoadJourneyCart } from "./road-journey-cart";
import { RoadSeedlingWheels } from "./road-seedling-wheels";
import { registerRoadWorkArt } from "./road-register-work-art";
import { RoadWaterway } from "./road-waterway";
import { RoadGait } from "@/lib/road-gait";
import { RoadEnemyFigures } from "./road-enemy-figure";
import { type RoadBattle, type RoadEnemy, type Traveller } from "@/lib/road-view";

import { RoadEffects } from "./road-effects";
import { RoadSpriteFilter } from "./road-sprite-filter";
import { RoadWorkCaption } from "./road-work-caption";
import { RoadEnemyLabels } from "./road-enemy-labels";
import { registerAdventureHero } from "./road-poses";
import { ROAD_HERB, ROAD_DESTINATION } from "./road-art";
import { adventureHeroAsset } from "@/lib/adventure-hero-art";
import { enemyArrived, enemyPresent, sceneEnemyHeight } from "./road-enemy-appearance";

export class RoadPainter {
  private waterway: RoadWaterway;
  private handheld: RoadHandheldProps;
  private nightLights: RoadNightLights;
  private journeyCart: RoadJourneyCart;
  private seedlingWheels: RoadSeedlingWheels;
  private gait = new RoadGait();
  private enemyFigures: RoadEnemyFigures;
  private background: RoadScenery;
  private gathering: Phaser.GameObjects.Image;
  private mossGlow: Phaser.GameObjects.Graphics;
  private workCaption: RoadWorkCaption;
  private effects: RoadEffects;
  private spriteFilter: RoadSpriteFilter;
  private bars: Phaser.GameObjects.Graphics;
  private strings: Phaser.GameObjects.Graphics;
  private sceneFade: Phaser.GameObjects.Graphics;
  private heroes = new Map<string, Figure>();
  private enemies = new Map<number, Figure>();
  private enemyLabels = new RoadEnemyLabels();
  private destination: Phaser.GameObjects.Image;
  private look?: RoadLook;

  constructor(private scene: Phaser.Scene) {
    this.waterway = new RoadWaterway(scene);
    this.handheld = new RoadHandheldProps(scene);
    this.nightLights = new RoadNightLights(scene);
    this.journeyCart = new RoadJourneyCart(scene);
    this.seedlingWheels = new RoadSeedlingWheels(scene);
    this.spriteFilter = new RoadSpriteFilter(scene);
    this.enemyFigures = new RoadEnemyFigures(this.spriteFilter);
    this.background = new RoadScenery(scene);
    this.gathering = scene.add.image(0, 0, ROAD_HERB).setDepth(16).setVisible(false);
    this.mossGlow = scene.add.graphics().setDepth(17.8);
    this.workCaption = new RoadWorkCaption(scene);
    this.effects = new RoadEffects(scene);
    this.strings = scene.add.graphics().setDepth(18);
    this.sceneFade = scene.add.graphics().setDepth(200);
    this.bars = scene.add.graphics().setDepth(30);
    this.destination = scene.add.image(0, 0, ROAD_DESTINATION).setOrigin(0.5, 1).setDepth(5);
    for (const id of ["aria", "leon", "mira", "finn"] as const) registerAdventureHero(scene, id);
    registerRoadWorkArt(scene);
    this.destination.setFrame("marker");
    const atlas = scene.textures.get("/sprites.png");
    const source = atlas.getSourceImage() as HTMLImageElement;
    atlas.add(
      "slime",
      0,
      0,
      Math.round((source.height * 2) / 3),
      Math.floor(source.width / 4),
      Math.floor(source.height / 3),
    );
    for (let i = 0; i < 12; i++)
      atlas.add(
        String(i),
        0,
        Math.round(((i % 4) * source.width) / 4),
        Math.round((Math.floor(i / 4) * source.height) / 3),
        Math.floor(source.width / 4),
        Math.floor(source.height / 3),
      );
  }

  private makeFigure(asset: string, frame: string, name: string): Figure {
    return {
      image: this.scene.add.image(0, 0, asset, frame).setOrigin(0.5, 0.9),
      bar: this.scene.add.graphics(),
      label: this.scene.add
        .text(0, 0, name, {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#fff6d8",
          stroke: "#102b24",
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setDepth(31),
    };
  }

  private screenX(x: number, state: RoadBattle) {
    return roadX(x, state.distance, this.scene.scale.width, state.stage);
  }

  private scenery(state: RoadBattle, reduced: boolean) {
    this.background.paint(state, reduced, this.look);
    const { width, height } = this.scene.scale;
    const length = this.look?.length ?? 1;
    const markerHeight = RPG_CAMERA_SCALE * Math.min(125, width * 0.26, height * 0.4);
    this.destination.setDisplaySize((markerHeight * 874) / 1144, markerHeight);
    this.destination.setPosition(this.screenX(length + 100, state), roadY(0.6, height, width));
    this.destination.setVisible(
      !!this.look?.destination &&
        !(
          this.look.storybookHeroes &&
          [
            "tower-road",
            "town-deliveries",
            "moss-night-road",
            "village-trade",
            "evening-trade-road",
            "berne-road",
          ].includes(this.look.quest ?? "")
        ) &&
        state.phase === "journey" &&
        state.distance > length - 380,
    );
  }

  private health(
    x: number,
    y: number,
    size: number,
    ratio: number,
    enemy = false,
    graphics = this.bars,
  ) {
    if (housecalls.firstChapterReturn(this.look) && !enemy) return;
    if (graphics !== this.bars && !enemy && this.look?.mossBeds?.recordsClosing) return;
    const width = size * 0.61;
    graphics.fillStyle(0x0a241d, 0.9).fillRoundedRect(x - width / 2, y, width, 5, 2);
    graphics
      .fillStyle(enemy ? 0xefb390 : 0xaad6a0)
      .fillRoundedRect(x - width / 2, y, width * ratio, 5, 2);
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(adventureHeroAsset(hero.id), "__BASE", "");
      this.heroes.set(hero.id, figure);
    }
    const size = this.look?.nightBridge
      ? housecalls.nightBridgeLayout(this.scene.scale, this.look.nightBridge.section).figureSize *
        fixedFigureScale(this.look, this.scene.scale)
      : housecalls.usesHousecallsLayout(this.look)
        ? housecalls.housecallsSceneLayout(this.scene.scale, this.look).figureSize *
          fixedFigureScale(this.look, this.scene.scale)
        : roadHeroSize(this.scene.scale.width, this.scene.scale.height);
    const strideFrame = this.gait.frame(hero, {
      width: this.scene.scale.width,
      height: this.scene.scale.height,
      stage: state.stage,
      figureSize: size,
    });
    const x = this.screenX(hero.x, state);
    const gathering = !!this.look?.workers.includes(hero.id) && state.gathering?.task === "gather";
    const crouch = gatherCrouch(gathering, reduced, state.time, this.look) * RPG_CAMERA_SCALE;
    const y = roadY(hero.lane, this.scene.scale.height, this.scene.scale.width) + crouch;
    const { luggage, frame: carryFrame } = paintRoadHeroPose(
      figure.image,
      state,
      hero,
      reduced,
      size,
      strideFrame,
      this.look,
    );
    faceRoadHero(figure.image, hero.facing);
    if (this.look?.storybookHeroes) this.spriteFilter.apply(figure.image);
    figure.image
      .setPosition(x, y)
      .setDepth(roadFigureDepth(hero.lane, this.scene.scale, this.look))
      .setTint(this.look?.night ? 0xd1d1d1 : 0xffffff)
      .setAlpha(roadHeroOpacity(hero.hp, !!this.look?.storybookHeroes));
    figure.label
      .setVisible(!!hero.paralyzed)
      .setText("麻痺")
      .setPosition(x, y - size);
    figure.bar.setDepth(roadFigureDepth(hero.lane, this.scene.scale, this.look) + 0.01);
    if (luggage) this.handheld.paint(hero, luggage, carryFrame, state, this.scene.scale, this.look);
    this.health(x, y + 4, size, hero.hp / hero.maxHp, false, figure.bar);
  }

  private paintEnemy(state: RoadBattle, enemy: RoadEnemy, reduced: boolean) {
    if (!enemyArrived(enemy, state.time, reduced)) return;
    let figure = this.enemies.get(enemy.id);
    if (!figure) {
      figure = this.makeFigure("/sprites.png", "slime", "");
      this.enemies.set(enemy.id, figure);
    }
    const size = sceneEnemyHeight(
      enemy,
      this.scene.scale.width,
      this.scene.scale.height,
      this.look,
    );
    const x = this.screenX(enemy.x, state),
      y = roadY(enemy.lane, this.scene.scale.height, this.scene.scale.width);
    this.enemyFigures.paint(
      figure.image,
      enemy,
      state,
      this.look,
      this.scene.scale,
      size,
      x,
      y,
      reduced,
    );
    figure.bar.setDepth(roadFigureDepth(enemy.lane, this.scene.scale, this.look) + 0.01);
    if (enemy.kind !== "pumpety" && !enemy.pose)
      this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true, figure.bar);
  }

  private paintGathering(state: RoadBattle, look: RoadLook, reduced: boolean) {
    const point = state.gathering;
    this.mossGlow.clear();
    this.gathering.setVisible(groundWorkVisible(state, look));
    if (!point) {
      this.seedlingWheels.paint(state, look, 0, 0, 0, false, reduced);
      this.workCaption.paint(state, look, 0, 0);
      return;
    }
    const cargo = point.kind === "cargo";
    const { x: worldX, lane } = roadWorkFoot(point, state.heroes, look);
    const x = this.screenX(worldX, state),
      y = roadY(lane, this.scene.scale.height, this.scene.scale.width);
    const appearance = roadGatheringAppearance(state, look, this.scene.scale, cargo);
    const { size } = appearance;
    const captionOffset = paintGroundWorkImage(this.gathering, look, point, this.scene.scale, {
      ...appearance,
      x,
      y,
      lane,
    });
    this.seedlingWheels.paint(state, look, x, y, size, this.gathering.visible, reduced);
    this.paintMossGlow(x, y, size, this.gathering.visible && !!look.night && cargo);
    this.workCaption.paint(state, look, x, y + captionOffset, this.workAvoidRects());
    // This courtyard has no fixed work object: the carrier and delivered items
    if (state.townParcelHandoff || hideFixedWorkProgress(look)) return;
    const progress = roadWorkProgressLayout(
      look,
      size,
      this.gathering.displayHeight,
      roadHeroSize(this.scene.scale.width, this.scene.scale.height),
    );
    if (point.task === "carry")
      this.transportProgress(
        x,
        y + progress.offset,
        progress.size,
        1 - point.remaining / point.total,
      );
    else this.health(x, y + progress.offset, progress.size, point.remaining / point.total);
  }
  private workAvoidRects() {
    return [
      ...this.background.trafficBounds,
      ...this.waterway.actorBounds,
      ...[...this.heroes.values(), ...this.enemies.values()].flatMap(({ image }) =>
        image.visible
          ? [
              image.getBounds(),
              {
                x: image.x - image.displayWidth / 2,
                y: image.y + 4,
                width: image.displayWidth,
                height: 7,
              },
            ]
          : [],
      ),
      ...[...this.heroes.values()].flatMap(({ label }) =>
        label.visible ? [label.getBounds()] : [],
      ),
    ];
  }
  private paintMossGlow(x: number, y: number, size: number, visible: boolean) {
    if (!visible) return;
    for (const [spread, alpha] of [
      [1.15, 0.025],
      [0.9, 0.04],
      [0.65, 0.06],
    ])
      this.mossGlow
        .fillStyle(0xc8ef99, alpha)
        .fillEllipse(x, y - size * 0.28, size * spread, size * spread * 0.55);
  }

  private transportProgress(x: number, y: number, size: number, progress: number) {
    const width = size * 0.7;
    this.bars.fillStyle(0x26362f, 0.9).fillRoundedRect(x - width / 2, y, width, 4, 2);
    this.bars.fillStyle(0xefcf89).fillRoundedRect(x - width / 2, y, width * progress, 4, 2);
  }

  paint(state: RoadBattle, reduced: boolean, look: RoadLook) {
    this.waterway.paint(state, look, reduced);
    this.handheld.begin();
    this.journeyCart.paint(state, reduced, look);
    this.look = look;
    this.scenery(state, reduced);
    this.bars.clear();
    for (const [id, figure] of this.enemies) {
      figure.bar.clear();
      if (enemyPresent(state, id, reduced)) continue;
      figure.image.destroy();
      figure.label.destroy();
      figure.bar.destroy();
      this.enemies.delete(id);
    }
    for (const [id, figure] of this.heroes) {
      const active = state.heroes.some((hero) => hero.id === id);
      figure.image.setVisible(active);
      figure.label.setVisible(active);
      figure.bar.clear().setVisible(active);
    }
    for (const hero of state.heroes) this.paintHero(state, hero, reduced);
    this.nightLights.paint(state, look, reduced, this.handheld.points.get("aria"));
    for (const enemy of state.enemies)
      if (enemy.hp > 0 || enemy.pose) this.paintEnemy(state, enemy, reduced);
    this.paintGathering(state, look, reduced);
    this.enemyLabels.paint(
      state,
      look,
      reduced,
      this.heroes,
      this.enemies,
      this.gathering,
      this.scene.scale.width,
      this.scene.scale.height,
      this.workCaption.bounds,
      this.waterway.bounds,
    );
    paintPuppetStrings(
      this.strings,
      state,
      this.scene.scale.height,
      this.scene.scale.width,
      (x) => this.screenX(x, state),
      look.storybookHeroes,
    );
    const screenX = (x: number) => this.screenX(x, state);
    this.effects.paint(state, reduced, screenX, look.storybookHeroes, !!look.mossBeds?.seedlings);
    paintRoadSceneFade(
      this.sceneFade,
      look,
      this.scene.scale.width,
      this.scene.scale.height,
      state,
    );
  }
}
