import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { roadBackdrop, roadX, roadY } from "@/lib/road-layout";
import {
  ROAD_LENGTH,
  travellerLane,
  travellerNames,
  type RoadBattle,
  type RoadEnemy,
  type Traveller,
} from "@/lib/scrolling-battle";

import { isWorking } from "@/lib/scrolling-travel";
import { RoadEffects } from "./road-effects";
import {
  roadSheet,
  roadFrame,
  roadWalkSheet,
  roadWalkFrame,
  ROAD_HERB,
  ROAD_CARGO,
  ROAD_PUPPETS,
  ROAD_PUSH,
  ROAD_WORKSITES,
} from "./road-art";

type Figure = { image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };
export const ROAD_BACKGROUND = "/scenery/forest-background.webp";
const puppetNames = { pumpety: "プティ", puppet: "人形", golem: "ゴーレム", slime: "" };
function enemyName(enemy: RoadEnemy) {
  if (enemy.kind !== "slime") return puppetNames[enemy.kind];
  return enemy.boss ? "大きなスライム" : "";
}
const enemySize = (enemy: RoadEnemy) => (enemy.boss ? 1.65 : enemy.kind === "pumpety" ? 1 : 0.75);

export class RoadPainter {
  private backdrop: Phaser.GameObjects.Image;
  private ground: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;
  private sizeKey = "";
  private gathering: Figure;
  private effects: RoadEffects;
  private bars: Phaser.GameObjects.Graphics;
  private heroes = new Map<string, Figure>();
  private enemies = new Map<number, Figure>();
  private destination: Phaser.GameObjects.Text;
  private look?: RoadLook;

  constructor(private scene: Phaser.Scene) {
    this.backdrop = scene.add.image(0, 0, ROAD_BACKGROUND).setOrigin(0).setDepth(0);
    this.ground = scene.add.graphics().setDepth(1);
    this.trail = scene.add.graphics().setDepth(2);
    this.gathering = this.makeFigure(ROAD_HERB, "__BASE", "薬草");
    this.gathering.image.setDepth(16).setVisible(false);
    this.gathering.label.setVisible(false);
    this.effects = new RoadEffects(scene);
    this.bars = scene.add.graphics().setDepth(30);
    this.destination = scene.add
      .text(0, 0, "森の出口 →", {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#ffedbc",
        backgroundColor: "#173d31",
        padding: { x: 12, y: 8 },
      })
      .setDepth(5);
    for (const id of ["aria", "leon", "mira"] as const) this.registerSheet(id);
    this.registerWorkArt();
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
    for (let index = 0; index < 12; index++) {
      const frame = roadFrame(id, index);
      texture.add(String(index), 0, frame.left, frame.top, frame.width, frame.height);
    }
    const walk = this.scene.textures.get(roadWalkSheet(id));
    for (let index = 0; index < 4; index++)
      walk.add(String(index), 0, (index % 2) * 627, Math.floor(index / 2) * 627, 627, 627);
  }

  private registerWorkArt() {
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
      [76, 114, 592, 462],
      [790, 113, 591, 486],
      [1505, 96, 600, 515],
    ];
    for (const [index, name] of ["moss", "waterway", "parcels"].entries()) {
      const [x, y, w, h] = objects[index];
      work.add(name, 0, x, y, w, h);
    }
    this.scene.textures.get(ROAD_CARGO).add("cart", 0, 48, 344, 1164, 582);
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
    const length = this.look?.length ?? ROAD_LENGTH;
    const view = roadBackdrop(
      width,
      height,
      source.width,
      source.height,
      reduced ? 0 : state.distance / length,
    );
    this.backdrop.setDisplaySize(view.width, view.height).setPosition(view.x, view.y);
    this.trail.setX(reduced ? 0 : -(((state.distance * width) / 560) % width));
    this.destination.setText(this.look ? "目的地 →" : "森の出口 →");
    this.destination.setPosition(this.screenX(length + 100, state), height * 0.36);
    this.destination.setVisible(state.phase === "journey" && state.distance > length - 380);
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
    if (reduced || hero.hp <= 0 || state.phase !== "journey") return 8;
    const hit = state.effects
      .filter((item) => item.hero === hero.id && item.kind !== "hurt" && item.kind !== "gather")
      .at(-1);
    const hurt = state.effects
      .filter((item) => item.hero === hero.id && item.kind === "hurt")
      .at(-1);
    if (hurt && state.time >= hurt.at && state.time - hurt.at < 300) return 11;
    if (hit && state.time >= hit.at && state.time - hit.at < 600)
      return 4 + Math.floor((state.time - hit.at) / 150);
    if (this.working(state, hero) && state.gathering?.kind === "herb")
      return 9 + (Math.floor(state.time / 380) % 2);
    return hero.walking ? Math.floor(state.time / 150) % 4 : 8;
  }

  private working(state: RoadBattle, hero: Traveller) {
    return this.look ? this.look.workers.includes(hero.id) : isWorking(state, hero);
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(roadSheet(hero.id), "8", travellerNames[hero.id]);
      this.heroes.set(hero.id, figure);
    }
    const size = Math.min(90, this.scene.scale.width * 0.18, this.scene.scale.height * 0.34);
    const x = this.screenX(hero.x, state);
    const gathering = this.working(state, hero) && state.gathering?.kind === "herb";
    const crouch = gathering && !reduced ? 4 + Math.sin(state.time / 280) * 2 : 0;
    const y = roadY(travellerLane(hero.id), this.scene.scale.height) + crouch;
    const pose = String(this.heroPose(state, hero, reduced));
    const pushing = this.applyWorkPose(figure.image, state, hero, reduced, size);
    if (!pushing) this.applyHeroPose(figure.image, hero.id, pose, size);
    figure.image
      .setPosition(x, y)
      .setFlipX(!pushing && hero.facing < 0)
      .setDepth(10 + travellerLane(hero.id) * 10)
      .setAlpha(hero.hp > 0 ? 1 : 0.35);
    figure.label
      .setPosition(x, y + 13)
      .setText(travellerNames[hero.id] + (hero.hp <= 0 ? " · 戦闘不能" : ""));
    this.health(x, y + 4, size, hero.hp / hero.maxHp);
  }

  private applyWorkPose(
    image: Phaser.GameObjects.Image,
    state: RoadBattle,
    hero: Traveller,
    reduced: boolean,
    size: number,
  ) {
    const pushing =
      this.working(state, hero) &&
      (state.gathering?.kind === "cargo" || this.look?.work?.frame === "parcels");
    if (pushing) {
      const step =
        !reduced &&
        state.gathering?.task === "carry" &&
        !state.enemies.some((enemy) => enemy.hp > 0)
          ? Math.floor(state.time / 220) % 2
          : 0;
      image
        .setTexture(ROAD_PUSH, `${hero.id}-${String(step)}`)
        .setOrigin(0.5, 1)
        .setScale((size * 0.9) / image.frame.height);
    }
    return pushing;
  }

  private applyHeroPose(
    image: Phaser.GameObjects.Image,
    id: Traveller["id"],
    pose: string,
    size: number,
  ) {
    const frame = roadFrame(id, Number(pose));
    const walking = Number(pose) < 4;
    const asset = walking ? roadWalkSheet(id) : roadSheet(id);
    const walk = walking ? roadWalkFrame(id, Number(pose)) : null;
    if (image.texture.key !== asset) image.setTexture(asset, pose);
    else if (image.frame.name !== pose) image.setFrame(pose);
    image
      .setScale(walk ? size * walk.scale : size / 362)
      .setOrigin(walk?.originX ?? frame.originX, walk?.originY ?? frame.originY);
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
    const bounce = reduced ? 0 : Math.sin(state.time / 170 + enemy.id) * 3;
    const puppet = enemy.kind !== "slime";
    const asset = puppet ? ROAD_PUPPETS : "/sprites.png";
    const frame = puppet ? enemy.kind : this.look?.enemies[enemy.id]?.frame || "slime";
    if (figure.image.texture.key !== asset || figure.image.frame.name !== frame)
      figure.image.setTexture(asset, frame);
    figure.image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(puppet ? enemy.x < state.heroes[0].x : enemy.x > state.heroes[0].x)
      .setDepth(10 + enemy.lane * 10);
    if (puppet) figure.image.setScale(size / 724).setOrigin(0.5, 0.98);
    figure.label
      .setPosition(x, y + 14)
      .setWordWrapWidth(Math.min(150, this.scene.scale.width * 0.3), true)
      .setText(this.enemyLabel(enemy));
    if (enemy.kind !== "pumpety") this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true);
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
      return { pack: "包み直し", carry: "運搬中", unload: "荷下ろし", gather: "" }[point.task];
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
    this.health(x, y + 5, size, point.remaining / point.total);
  }

  paint(state: RoadBattle, reduced: boolean, look?: RoadLook) {
    this.look = look;
    this.scenery(state, reduced);
    this.bars.clear();
    this.paintGathering(state);
    for (const [id, figure] of this.enemies) {
      if (state.enemies.some((enemy) => enemy.id === id && enemy.hp > 0)) continue;
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
    for (const enemy of state.enemies) if (enemy.hp > 0) this.paintEnemy(state, enemy, reduced);
    this.effects.paint(state, reduced, (x) => this.screenX(x, state));
  }
}
