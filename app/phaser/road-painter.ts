import { paintPuppetStrings } from "./road-puppet-strings";
import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { roadBackdrop, roadX, roadY } from "@/lib/road-layout";
import { travellerLane, type RoadBattle, type RoadEnemy, type Traveller } from "@/lib/road-view";

import { RoadEffects } from "./road-effects";
import { RoadSpriteFilter } from "./road-sprite-filter";
import { applyHeroPose, applyWorkPose } from "./road-poses";
import {
  roadSheet,
  roadFrame,
  roadWalkSheet,
  ROAD_HERB,
  ROAD_CARGO,
  ROAD_PUPPETS,
  ROAD_PUSH,
  ROAD_PACKING,
  ROAD_DESTINATION,
  ROAD_WORKSITES,
  ROAD_SIGNPOST,
  miraFrames,
} from "./road-art";

type Figure = { image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };
export const ROAD_BACKGROUND = "/scenery/forest-background.webp";
const puppetNames = { pumpety: "プティ", puppet: "人形", golem: "ゴーレム", slime: "" };
function enemyName(enemy: RoadEnemy) {
  if (enemy.kind !== "slime") return puppetNames[enemy.kind];
  return enemy.boss ? "大きなスライム" : "";
}
const enemyFalls = (enemy: RoadEnemy) => enemy.pose === "fallen" || enemy.pose === "drag";
function enemyFacesRight(enemy: RoadEnemy, heroX: number) {
  if (enemy.pose === "retreat" || enemy.pose === "drag") return true;
  return enemy.kind !== "slime" ? enemy.x < heroX : enemy.x > heroX;
}
const enemySize = (enemy: RoadEnemy) => (enemy.boss ? 1.65 : enemy.kind === "pumpety" ? 1 : 0.75);

export class RoadPainter {
  private backdrop: Phaser.GameObjects.Image;
  private ground: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;
  private sizeKey = "";
  private gathering: Figure;
  private effects: RoadEffects;
  private spriteFilter: RoadSpriteFilter;
  private bars: Phaser.GameObjects.Graphics;
  private strings: Phaser.GameObjects.Graphics;
  private heroes = new Map<string, Figure>();
  private enemies = new Map<number, Figure>();
  private destination: Phaser.GameObjects.Image;
  private look?: RoadLook;

  constructor(private scene: Phaser.Scene) {
    this.spriteFilter = new RoadSpriteFilter(scene);
    this.backdrop = scene.add.image(0, 0, ROAD_BACKGROUND).setOrigin(0).setDepth(0);
    this.ground = scene.add.graphics().setDepth(1);
    this.trail = scene.add.graphics().setDepth(2);
    this.gathering = this.makeFigure(ROAD_HERB, "__BASE", "薬草");
    this.gathering.image.setDepth(16).setVisible(false);
    this.gathering.label.setVisible(false);
    this.effects = new RoadEffects(scene);
    this.strings = scene.add.graphics().setDepth(18);
    this.bars = scene.add.graphics().setDepth(30);
    this.destination = scene.add.image(0, 0, ROAD_DESTINATION).setOrigin(0.5, 1).setDepth(5);
    for (const id of ["aria", "leon", "mira"] as const) this.registerSheet(id);
    this.registerWorkArt();
    this.destination.setFrame("marker");
    const puppets = scene.textures.get(ROAD_PUPPETS);
    puppets.add("pumpety", 0, 0, 0, 740, 724);
    puppets.add("puppet", 0, 740, 0, 610, 724);
    puppets.add("golem", 0, 1350, 0, 822, 724);
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

  private registerSheet(id: Traveller["id"]) {
    const texture = this.scene.textures.get(roadSheet(id));
    if (id === "mira") {
      for (const [index, [x, y, w, h]] of miraFrames.entries())
        texture.add(String(index), 0, x, y, w, h);
    }
    for (let index = 0; index < 12; index++) {
      if (id === "mira") continue;
      const frame = roadFrame(id, index);
      texture.add(String(index), 0, frame.left, frame.top, frame.width, frame.height);
    }
    const walk = this.scene.textures.get(roadWalkSheet(id));
    for (let index = 0; index < 4; index++)
      walk.add(String(index), 0, (index % 2) * 627, Math.floor(index / 2) * 627, 627, 627);
  }

  private registerWorkArt() {
    this.scene.textures.get(ROAD_SIGNPOST).add("signpost", 0, 269, 74, 690, 1157);
    this.scene.textures.get(ROAD_DESTINATION).add("marker", 0, 209, 86, 874, 1144);
    this.registerPackingArt();
    const push = this.scene.textures.get(ROAD_PUSH);
    const rects = [
      [49, 31, 429, 458],
      [567, 32, 414, 459],
      [57, 517, 425, 461],
      [561, 516, 421, 462],
      [70, 1005, 438, 487],
      [551, 1007, 434, 487],
    ];
    for (const [index, id] of ["aria", "leon", "mira"].entries())
      for (let step = 0; step < 2; step++) {
        const [x, y, w, h] = rects[index * 2 + step];
        push.add(`${id}-${String(step)}`, 0, x, y, w, h);
      }
    const work = this.scene.textures.get(ROAD_WORKSITES);
    const objects = [
      [133, 215, 497, 339],
      [798, 147, 564, 433],
      [1504, 195, 538, 398],
    ];
    for (const [index, name] of ["moss", "waterway", "parcels"].entries()) {
      const [x, y, w, h] = objects[index];
      work.add(name, 0, x, y, w, h);
    }
    this.scene.textures.get(ROAD_CARGO).add("cart", 0, 48, 344, 1164, 582);
  }
  private registerPackingArt() {
    const texture = this.scene.textures.get(ROAD_PACKING);
    const rects = [
      [260, 36, 305, 358],
      [692, 38, 294, 357],
      [240, 427, 336, 358],
      [666, 431, 336, 355],
      [233, 821, 337, 362],
      [662, 824, 335, 361],
    ];
    for (const [row, id] of ["aria", "leon", "mira"].entries())
      for (let step = 0; step < 2; step++) {
        const [x, y, w, h] = rects[row * 2 + step];
        texture.add(`${id}-${String(step)}`, 0, x, y, w, h);
      }
  }

  private makeFigure(asset: string, frame: string, name: string): Figure {
    return {
      image: this.scene.add.image(0, 0, asset, frame).setOrigin(0.5, 0.9),
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
    const background = this.look?.background || ROAD_BACKGROUND;
    if (this.backdrop.texture.key !== background) {
      this.backdrop.setTexture(background);
      this.sizeKey = "";
    }
    const { width, height } = this.scene.scale;
    const key = `${String(width)}:${String(height)}:${String(this.look?.urban)}`;
    if (this.sizeKey !== key) {
      this.sizeKey = key;
      this.resizeScenery(width, height);
    }
    const source = this.backdrop.texture.getSourceImage() as HTMLImageElement;
    const length = this.look?.length ?? 1;
    const view = roadBackdrop(
      width,
      height,
      source.width,
      source.height,
      reduced ? 0 : state.distance / length,
    );
    this.backdrop.setDisplaySize(view.width, view.height).setPosition(view.x, view.y);
    this.trail.setX(reduced ? 0 : -(((state.distance * width) / 560) % width));
    const markerHeight = Math.min(125, width * 0.26, height * 0.4);
    this.destination.setDisplaySize((markerHeight * 874) / 1144, markerHeight);
    this.destination.setPosition(this.screenX(length + 100, state), roadY(0.6, height));
    this.destination.setVisible(
      !!this.look?.destination && state.phase === "journey" && state.distance > length - 380,
    );
  }

  private resizeScenery(width: number, height: number) {
    this.backdrop.setAlpha(0.9);
    this.ground.clear();
    this.ground.fillStyle(0x132f25, 0.36).fillRect(0, 0, width, height);
    this.trail.clear();
    if (this.look?.urban) return;
    for (let index = 0; index < 36; index++) {
      const x = (index * width) / 18;
      const y = roadY(index % 2 ? 1.05 : 0.28, height);
      this.trail.fillStyle(index % 3 ? 0x426541 : 0xa4b478, 0.7);
      this.trail.fillEllipse(x, y, 16 + ((index % 18) % 4) * 6, 5);
      this.trail.lineStyle(2, 0x749a60, 0.7);
      this.trail.lineBetween(x, y, x - 4, y - 9);
      this.trail.lineBetween(x + 2, y, x + 6, y - 13);
    }
  }

  private health(x: number, y: number, size: number, ratio: number, enemy = false) {
    const width = size * 0.61;
    this.bars.fillStyle(0x0a241d, 0.9).fillRoundedRect(x - width / 2, y, width, 5, 2);
    this.bars
      .fillStyle(enemy ? 0xefb390 : 0xaad6a0)
      .fillRoundedRect(x - width / 2, y, width * ratio, 5, 2);
  }

  private heroPose(state: RoadBattle, hero: Traveller, reduced: boolean) {
    if (reduced || state.scene || hero.hp <= 0 || state.phase !== "journey") return 8;
    const hit = state.effects
      .filter((item) => item.hero === hero.id && item.kind !== "hurt" && item.kind !== "gather")
      .at(-1);
    const hurt = state.effects
      .filter((item) => item.hero === hero.id && item.kind === "hurt")
      .at(-1);
    if (hurt && state.time >= hurt.at && state.time - hurt.at < 300) return 11;
    if (hit && state.time >= hit.at && state.time - hit.at < 600)
      return 4 + Math.floor((state.time - hit.at) / 150);
    if (this.working(hero) && state.gathering?.task === "gather")
      return 9 + (Math.floor(state.time / 380) % 2);
    return hero.walking ? Math.floor(state.time / 150) % 4 : 8;
  }

  private working(hero: Traveller) {
    return !!this.look?.workers.includes(hero.id);
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(roadSheet(hero.id), "8", "");
      this.heroes.set(hero.id, figure);
    }
    const size = Math.min(90, this.scene.scale.width * 0.18, this.scene.scale.height * 0.34);
    const x = this.screenX(hero.x, state);
    const gathering = this.working(hero) && state.gathering?.task === "gather";
    const crouch = gathering && !reduced ? 4 + Math.sin(state.time / 280) * 2 : 0;
    const y = roadY(travellerLane(hero.id), this.scene.scale.height) + crouch;
    const pose = String(this.heroPose(state, hero, reduced));
    const pushing = this.working(hero) && applyWorkPose(figure.image, state, hero, reduced, size);
    if (!pushing) applyHeroPose(figure.image, hero.id, pose, size);
    this.spriteFilter.apply(figure.image);
    figure.image
      .setPosition(x, y)
      .setFlipX(hero.facing < 0)
      .setDepth(10 + travellerLane(hero.id) * 10)
      .setAlpha(hero.hp > 0 ? 1 : 0.35);
    figure.label.setVisible(false);
    this.health(x, y + 4, size, hero.hp / hero.maxHp);
  }

  private enemyLabel(enemy: RoadEnemy) {
    return this.look?.enemies[enemy.id]?.label || enemyName(enemy);
  }
  private paintEnemy(state: RoadBattle, enemy: RoadEnemy, reduced: boolean) {
    let figure = this.enemies.get(enemy.id);
    if (!figure) {
      figure = this.makeFigure("/sprites.png", "slime", "");
      this.enemies.set(enemy.id, figure);
    }
    const size =
      Math.min(115, this.scene.scale.width * 0.19, this.scene.scale.height * 0.32) *
      enemySize(enemy);
    const x = this.screenX(enemy.x, state),
      y = roadY(enemy.lane, this.scene.scale.height);
    const bounce =
      reduced || enemy.pose === "fallen" ? 0 : Math.sin(state.time / 170 + enemy.id) * 3;
    const puppet = enemy.kind !== "slime";
    const asset = puppet ? ROAD_PUPPETS : "/sprites.png";
    const frame = puppet ? enemy.kind : this.look?.enemies[enemy.id]?.frame || "slime";
    if (figure.image.texture.key !== asset || figure.image.frame.name !== frame)
      figure.image.setTexture(asset, frame);
    figure.image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(enemyFacesRight(enemy, state.heroes[0].x))
      .setAngle(enemyFalls(enemy) ? -20 : 0)
      .setDepth(10 + enemy.lane * 10);
    if (puppet) figure.image.setScale(size / 724).setOrigin(0.5, 0.98);
    figure.label
      .setVisible(!enemy.pose)
      .setPosition(x, y + 14)
      .setWordWrapWidth(Math.min(150, this.scene.scale.width * 0.3), true)
      .setText(this.enemyLabel(enemy));
    if (enemy.kind !== "pumpety" && !enemy.pose)
      this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true);
  }

  private workAppearance(cargo: boolean) {
    const size = cargo
      ? Math.min(145, this.scene.scale.width * 0.3)
      : Math.min(this.look?.work?.frame === "waterway" ? 85 : 65, this.scene.scale.width * 0.2);
    const asset = this.look?.work?.asset || (cargo ? ROAD_CARGO : ROAD_HERB);
    const frame = this.look?.work?.frame || (cargo ? "cart" : "__BASE");
    return { size, asset, frame };
  }

  private workLabel(point: NonNullable<RoadBattle["gathering"]>) {
    if (this.look?.work) return this.look.work.label;
    if (point.kind === "cargo")
      return {
        pack: "包み直し",
        carry: "運搬中",
        unload: "荷下ろし",
        gather: "",
        inspect: "確認中",
      }[point.task];
    return point.remaining < point.total ? "採取中" : "薬草";
  }

  private paintGathering(state: RoadBattle) {
    const point = state.gathering;
    this.gathering.image.setVisible(!!point);
    this.gathering.label.setVisible(!!point && this.scene.scale.height >= 240);
    if (!point) return;
    const cargo = point.kind === "cargo";
    const lane = cargo ? 0.82 : 0.68;
    const x = this.screenX(point.x + 65, state),
      y = roadY(lane, this.scene.scale.height);
    const { size, asset, frame } = this.workAppearance(cargo);
    if (this.gathering.image.texture.key !== asset || this.gathering.image.frame.name !== frame)
      this.gathering.image.setTexture(asset, frame);
    this.gathering.image.setOrigin(0.5, cargo || this.look?.work?.frame ? 1 : 0.92);
    this.gathering.image
      .setPosition(x, y)
      .setScale(size / this.gathering.image.frame.width)
      .setDepth(10 + lane * 10);
    this.gathering.label
      .setText(this.workLabel(point))
      .setWordWrapWidth(Math.min(190, this.scene.scale.width * 0.42), true)
      .setPosition(x, roadY(0.82, this.scene.scale.height) + 36);
    if (point.task === "carry")
      this.transportProgress(x, y + 5, size, 1 - point.remaining / point.total);
    else this.health(x, y + 5, size, point.remaining / point.total);
  }
  private transportProgress(x: number, y: number, size: number, progress: number) {
    const width = size * 0.7;
    this.bars.fillStyle(0x26362f, 0.9).fillRoundedRect(x - width / 2, y, width, 4, 2);
    this.bars.fillStyle(0xefcf89).fillRoundedRect(x - width / 2, y, width * progress, 4, 2);
  }

  paint(state: RoadBattle, reduced: boolean, look: RoadLook) {
    this.look = look;
    this.scenery(state, reduced);
    this.bars.clear();
    this.paintGathering(state);
    for (const [id, figure] of this.enemies) {
      if (state.enemies.some((enemy) => enemy.id === id && (enemy.hp > 0 || enemy.pose))) continue;
      figure.image.destroy();
      figure.label.destroy();
      this.enemies.delete(id);
    }
    for (const [id, figure] of this.heroes) {
      const active = state.heroes.some((hero) => hero.id === id);
      figure.image.setVisible(active);
      figure.label.setVisible(active);
    }
    for (const hero of state.heroes) this.paintHero(state, hero, reduced);
    for (const enemy of state.enemies)
      if (enemy.hp > 0 || enemy.pose) this.paintEnemy(state, enemy, reduced);
    paintPuppetStrings(this.strings, state, this.scene.scale.height, (x) => this.screenX(x, state));
    this.effects.paint(state, reduced, (x) => this.screenX(x, state));
  }
}
