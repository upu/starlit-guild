import { paintPuppetStrings } from "./road-puppet-strings";
import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { roadBackdrop, roadX, roadY } from "@/lib/road-layout";
import { type RoadBattle, type RoadEnemy, type Traveller } from "@/lib/road-view";

import { RoadEffects } from "./road-effects";
import { RoadSpriteFilter } from "./road-sprite-filter";
import { RoadWorkCaption } from "./road-work-caption";
import { applyHeroPose, applyWorkPose, registerAdventureHero } from "./road-poses";
import {
  ROAD_HERB,
  ROAD_CARGO,
  ROAD_PUPPETS,
  ROAD_DESTINATION,
  ROAD_WORKSITES,
  ROAD_BERNE_WORKSITES,
  ROAD_LEDGER_DESK,
  ROAD_SIGNPOST,
} from "./road-art";
import { adventureHeroAsset } from "@/lib/adventure-hero-art";
import {
  enemyAppearance,
  enemyArrived,
  enemyPresent,
  enemyFacesRight,
  enemyAngle,
  fitEnemy,
  enemyLabel,
  enemyDisplayHeight,
} from "./road-enemy-appearance";

type Figure = { image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };
export const ROAD_BACKGROUND = "/scenery/forest-background.webp";

export class RoadPainter {
  private backdrop: Phaser.GameObjects.Image;
  private ground: Phaser.GameObjects.Graphics;
  private sizeKey = "";
  private gathering: Phaser.GameObjects.Image;
  private workCaption: RoadWorkCaption;
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
    this.gathering = scene.add.image(0, 0, ROAD_HERB).setDepth(16).setVisible(false);
    this.workCaption = new RoadWorkCaption(scene);
    this.effects = new RoadEffects(scene);
    this.strings = scene.add.graphics().setDepth(18);
    this.bars = scene.add.graphics().setDepth(30);
    this.destination = scene.add.image(0, 0, ROAD_DESTINATION).setOrigin(0.5, 1).setDepth(5);
    for (const id of ["aria", "leon", "mira", "finn"] as const) registerAdventureHero(scene, id);
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

  private registerWorkArt() {
    this.scene.textures.get(ROAD_SIGNPOST).add("signpost", 0, 470, 340, 370, 605);
    this.scene.textures.get(ROAD_DESTINATION).add("marker", 0, 209, 86, 874, 1144);
    const work = this.scene.textures.get(ROAD_WORKSITES);
    const berne = this.scene.textures.get(ROAD_BERNE_WORKSITES);
    berne.add("stonework", 0, 53, 271, 788, 433);
    berne.add("records", 0, 933, 250, 797, 468);
    this.scene.textures.get(ROAD_LEDGER_DESK).add("ledger", 0, 15, 240, 1230, 930);
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
    const key = `${String(width)}:${String(height)}`;
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
    return hero.walking ? `walk-${String(Math.floor(state.time / 90) % 8)}` : 8;
  }

  private working(hero: Traveller) {
    return !!this.look?.workers.includes(hero.id);
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(adventureHeroAsset(hero.id), "__BASE", "");
      this.heroes.set(hero.id, figure);
    }
    const size = Math.min(90, this.scene.scale.width * 0.18, this.scene.scale.height * 0.34);
    const x = this.screenX(hero.x, state);
    const gathering = this.working(hero) && state.gathering?.task === "gather";
    const crouch = gathering && !reduced ? 4 + Math.sin(state.time / 280) * 2 : 0;
    const y = roadY(hero.lane, this.scene.scale.height) + crouch;
    const pose = String(this.heroPose(state, hero, reduced));
    const pulling = this.look?.frontCarriers.includes(hero.id) || false;
    const working =
      this.working(hero) && applyWorkPose(figure.image, state, hero, reduced, size, pulling);
    if (!working) applyHeroPose(figure.image, hero.id, pose, size);
    figure.image
      .setPosition(x, y)
      .setFlipX(hero.facing < 0)
      .setDepth(10 + hero.lane * 10)
      .setAlpha(hero.hp > 0 ? 1 : 0.35);
    figure.label
      .setVisible(!!hero.paralyzed)
      .setText("麻痺")
      .setPosition(x, y - size);
    this.health(x, y + 4, size, hero.hp / hero.maxHp);
  }

  private paintEnemy(state: RoadBattle, enemy: RoadEnemy, reduced: boolean) {
    if (!enemyArrived(enemy, state.time, reduced)) return;
    let figure = this.enemies.get(enemy.id);
    if (!figure) {
      figure = this.makeFigure("/sprites.png", "slime", "");
      this.enemies.set(enemy.id, figure);
    }
    const size = enemyDisplayHeight(enemy, this.scene.scale.width, this.scene.scale.height);
    const x = this.screenX(enemy.x, state),
      y = roadY(enemy.lane, this.scene.scale.height);
    const bounce =
      reduced || enemy.pose === "fallen" ? 0 : Math.sin(state.time / 170 + enemy.id) * 3;
    const { asset, frame, character, puppet } = enemyAppearance(enemy, this.look);
    const facesRight = enemyFacesRight(enemy, state.heroes[0].x);
    if (figure.image.texture.key !== asset || figure.image.frame.name !== frame)
      figure.image.setTexture(asset, frame);
    figure.image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(character ? !facesRight : facesRight)
      .setAngle(enemyAngle(enemy, state.time, reduced))
      .setDepth(10 + enemy.lane * 10);
    fitEnemy(figure.image, enemy, size, state.time, reduced);
    const heroHeight =
      Math.min(90, this.scene.scale.width * 0.18, this.scene.scale.height * 0.34) * 0.9;
    const aspect =
      character || puppet || enemy.kind === "mushroom"
        ? figure.image.frame.cutWidth / figure.image.frame.cutHeight
        : 1;
    this.spriteFilter.applyPixel(figure.image, heroHeight, { width: size * aspect, height: size });
    figure.label
      .setVisible(!enemy.pose)
      .setPosition(x, y + 14)
      .setWordWrapWidth(Math.min(150, this.scene.scale.width * 0.3), true)
      .setText(enemyLabel(enemy, this.look));
    if (enemy.kind !== "pumpety" && !enemy.pose)
      this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true);
  }

  private workAppearance(cargo: boolean) {
    const size = cargo
      ? Math.min(145, this.scene.scale.width * 0.3)
      : Math.min(
          ({ waterway: 85, signpost: 44, ledger: 85 } as Record<string, number>)[
            this.look?.work?.frame || ""
          ] || 65,
          this.scene.scale.width * 0.2,
        );
    const asset = this.look?.work?.asset || (cargo ? ROAD_CARGO : ROAD_HERB);
    const frame = this.look?.work?.frame || (cargo ? "cart" : "__BASE");
    return { size, asset, frame };
  }

  private paintGathering(state: RoadBattle, look: RoadLook) {
    const point = state.gathering;
    this.gathering.setVisible(!!point);
    if (!point) {
      this.workCaption.paint(state, look, 0, 0);
      return;
    }
    const cargo = point.kind === "cargo";
    const lane = cargo ? 0.82 : 0.68;
    const x = this.screenX(point.x + 65, state),
      y = roadY(lane, this.scene.scale.height);
    const { size, asset, frame } = this.workAppearance(cargo);
    if (this.gathering.texture.key !== asset || this.gathering.frame.name !== frame)
      this.gathering.setTexture(asset, frame);
    this.gathering.setOrigin(0.5, cargo || this.look?.work?.frame ? 1 : 0.92);
    this.gathering
      .setPosition(x, y)
      .setScale(size / this.gathering.frame.width)
      .setDepth(10 + lane * 10 - 0.1)
      .setFlipX(cargo && point.task === "carry" && !!this.look?.puller);
    this.workCaption.paint(
      state,
      look,
      x,
      y + this.gathering.displayHeight * (1 - this.gathering.originY),
    );
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
    this.paintGathering(state, look);
    for (const [id, figure] of this.enemies) {
      if (enemyPresent(state, id, reduced)) continue;
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
