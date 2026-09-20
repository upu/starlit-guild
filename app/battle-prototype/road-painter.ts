import type Phaser from "phaser";
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
  private backdrop: Phaser.GameObjects.TileSprite;
  private ground: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics;
  private sizeKey = "";
  private gathering: Figure;
  private effects: RoadEffects;
  private bars: Phaser.GameObjects.Graphics;
  private heroes = new Map<string, Figure>();
  private enemies = new Map<number, Figure>();
  private destination: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {
    this.backdrop = scene.add.tileSprite(0, 0, 1, 1, ROAD_BACKGROUND).setOrigin(0).setDepth(0);
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
    if (state.stage === "puppets")
      return this.scene.scale.width * 0.2 + ((x - state.distance) * this.scene.scale.width) / 600;
    return this.scene.scale.width * 0.35 + ((x - state.distance) * this.scene.scale.width) / 560;
  }

  private scenery(state: RoadBattle, reduced: boolean) {
    const { width, height } = this.scene.scale;
    const key = `${String(width)}:${String(height)}`;
    if (this.sizeKey !== key) {
      this.sizeKey = key;
      this.resizeScenery(width, height);
    }
    const position = reduced ? 0 : state.distance * 0.3;
    if (this.backdrop.tilePositionX !== position) this.backdrop.tilePositionX = position;
    this.trail.setX(reduced ? 0 : -(((state.distance * width) / 560) % width));
    this.destination.setPosition(this.screenX(ROAD_LENGTH + 100, state), height * 0.36);
    this.destination.setVisible(state.distance > ROAD_LENGTH - 380);
  }

  private resizeScenery(width: number, height: number) {
    const source = this.backdrop.texture.getSourceImage() as HTMLImageElement;
    this.backdrop
      .setSize(width, height)
      .setTileScale(Math.max(width / source.width, height / source.height))
      .setAlpha(0.8);
    this.ground.clear();
    this.ground.fillStyle(0x132f25, 0.36).fillRect(0, 0, width, height);
    this.ground.fillStyle(0x9c9264, 0.25).fillRect(0, height * 0.57, width, height * 0.29);
    this.trail.clear();
    for (let index = 0; index < 36; index++) {
      const x = (index * width) / 18;
      const y = height * (index % 2 ? 0.89 : 0.49);
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
      .filter((item) => item.hero === hero.id && item.kind !== "hurt")
      .at(-1);
    const hurt = state.effects
      .filter((item) => item.hero === hero.id && item.kind === "hurt")
      .at(-1);
    if (hurt && state.time >= hurt.at && state.time - hurt.at < 300) return 11;
    if (hit && state.time >= hit.at && state.time - hit.at < 600)
      return 4 + Math.floor((state.time - hit.at) / 150);
    if (isWorking(state, hero) && state.gathering?.kind === "herb")
      return 9 + (Math.floor(state.time / 380) % 2);
    return hero.walking ? Math.floor(state.time / 150) % 4 : 8;
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(roadSheet(hero.id), "8", travellerNames[hero.id]);
      this.heroes.set(hero.id, figure);
    }
    const size = Math.min(108, this.scene.scale.width * 0.18, this.scene.scale.height * 0.34);
    const x = this.screenX(hero.x, state);
    const gathering = isWorking(state, hero) && state.gathering?.kind === "herb";
    const crouch = gathering && !reduced ? 4 + Math.sin(state.time / 280) * 2 : 0;
    const y = travellerLane(hero.id) * this.scene.scale.height + crouch;
    const pose = String(this.heroPose(state, hero, reduced));
    this.applyHeroPose(figure.image, hero.id, pose, size);
    figure.image
      .setPosition(x, y)
      .setFlipX(hero.facing < 0)
      .setDepth(10 + travellerLane(hero.id) * 10)
      .setAlpha(hero.hp > 0 ? 1 : 0.35);
    figure.label.setPosition(x, y + 13);
    this.health(x, y + 4, size, hero.hp / hero.maxHp);
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
      y = enemy.lane * this.scene.scale.height;
    const bounce = reduced ? 0 : Math.sin(state.time / 170 + enemy.id) * 3;
    const puppet = enemy.kind !== "slime";
    const asset = puppet ? ROAD_PUPPETS : "/sprites.png";
    const frame = puppet ? enemy.kind : "slime";
    if (figure.image.texture.key !== asset || figure.image.frame.name !== frame)
      figure.image.setTexture(asset, frame);
    figure.image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(puppet ? enemy.x < state.heroes[0].x : enemy.x > state.heroes[0].x)
      .setDepth(10 + enemy.lane * 10);
    if (puppet) figure.image.setScale(size / 724).setOrigin(0.5, 0.98);
    figure.label.setPosition(x, y + 14).setText(enemyName(enemy));
    if (enemy.kind !== "pumpety") this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true);
  }

  private paintGathering(state: RoadBattle) {
    const point = state.gathering;
    this.gathering.image.setVisible(!!point);
    this.gathering.label.setVisible(!!point);
    if (!point) return;
    const cargo = point.kind === "cargo";
    const x = this.screenX(point.x + 65, state),
      y = this.scene.scale.height * 0.64;
    const size = cargo
      ? Math.min(145, this.scene.scale.width * 0.3)
      : Math.min(48, this.scene.scale.width * 0.12);
    const asset = cargo ? ROAD_CARGO : ROAD_HERB;
    if (this.gathering.image.texture.key !== asset) this.gathering.image.setTexture(asset);
    this.gathering.image.setOrigin(0.5, cargo ? 0.74 : 0.92);
    this.gathering.image.setPosition(x, y).setDisplaySize(size, size);
    this.gathering.label
      .setText(
        cargo
          ? { pack: "包み直し", carry: "運搬中", unload: "荷下ろし", gather: "" }[point.task]
          : point.remaining < point.total
            ? "採取中"
            : "薬草",
      )
      .setPosition(x, y + 14);
    this.health(x, y + 5, size, point.remaining / point.total);
  }

  paint(state: RoadBattle, reduced: boolean) {
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
