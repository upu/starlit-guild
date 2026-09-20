import type Phaser from "phaser";
import {
  ROAD_LENGTH,
  travellerLane,
  travellerNames,
  travellerOffset,
  type RoadBattle,
  type RoadEnemy,
  type RoadEffect,
  type Traveller,
} from "@/lib/scrolling-battle";

type Figure = { image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };
export const ROAD_BACKGROUND = "/scenery/forest-background.webp";

export class RoadPainter {
  private backdrop: Phaser.GameObjects.TileSprite;
  private ground: Phaser.GameObjects.Graphics;
  private effects: Phaser.GameObjects.Graphics;
  private bars: Phaser.GameObjects.Graphics;
  private heroes = new Map<string, Figure>();
  private enemies = new Map<number, Figure>();
  private destination: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {
    this.backdrop = scene.add.tileSprite(0, 0, 1, 1, ROAD_BACKGROUND).setOrigin(0).setDepth(0);
    this.ground = scene.add.graphics().setDepth(1);
    this.effects = scene.add.graphics().setDepth(40);
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
    for (const id of ["aria", "leon"]) this.registerSheet(id);
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

  private registerSheet(id: string) {
    const texture = this.scene.textures.get(`/animations/${id}-v1.png`);
    const image = texture.getSourceImage() as HTMLImageElement;
    for (let index = 0; index < 12; index++)
      texture.add(
        String(index),
        0,
        Math.round(((index % 4) * image.width) / 4),
        Math.round((Math.floor(index / 4) * image.height) / 3),
        Math.floor(image.width / 4),
        Math.floor(image.height / 3),
      );
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
    return this.scene.scale.width * 0.35 + ((x - state.distance) * this.scene.scale.width) / 560;
  }

  private scenery(state: RoadBattle, reduced: boolean) {
    const { width, height } = this.scene.scale;
    const source = this.backdrop.texture.getSourceImage() as HTMLImageElement;
    const scale = Math.max(width / source.width, height / source.height);
    this.backdrop.setSize(width, height).setTileScale(scale).setAlpha(0.8);
    this.backdrop.tilePositionX = reduced ? 0 : state.distance * 0.3;
    this.ground.clear();
    this.ground.fillStyle(0x132f25, 0.36).fillRect(0, 0, width, height);
    this.ground.fillStyle(0x9c9264, 0.25).fillRect(0, height * 0.57, width, height * 0.29);
    this.roadDetails(state, reduced);
    this.destination.setPosition(this.screenX(ROAD_LENGTH + 100, state), height * 0.36);
    this.destination.setVisible(state.distance > ROAD_LENGTH - 380);
  }

  private roadDetails(state: RoadBattle, reduced: boolean) {
    const { width, height } = this.scene.scale;
    const offset = reduced ? 0 : (state.distance * width) / 560;
    for (let index = 0; index < 18; index++) {
      const x = ((((index * 97 - offset) % (width + 130)) + width + 130) % (width + 130)) - 65;
      const y = height * (index % 2 ? 0.89 : 0.49);
      this.ground.fillStyle(index % 3 ? 0x426541 : 0xa4b478, 0.7);
      this.ground.fillEllipse(x, y, 16 + (index % 4) * 6, 5);
      this.ground.lineStyle(2, 0x749a60, 0.7);
      this.ground.lineBetween(x, y, x - 4, y - 9);
      this.ground.lineBetween(x + 2, y, x + 6, y - 13);
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
    if (hurt && state.time - hurt.at < 300) return 10 + Math.floor((state.time - hurt.at) / 150);
    if (hit && state.time - hit.at < 600) return 4 + Math.floor((state.time - hit.at) / 150);
    return state.walking ? Math.floor(state.time / 150) % 4 : 8;
  }

  private paintHero(state: RoadBattle, hero: Traveller, reduced: boolean) {
    let figure = this.heroes.get(hero.id);
    if (!figure) {
      figure = this.makeFigure(`/animations/${hero.id}-v1.png`, "8", travellerNames[hero.id]);
      this.heroes.set(hero.id, figure);
    }
    const size = Math.min(145, this.scene.scale.width * 0.24, this.scene.scale.height * 0.44);
    const x = this.screenX(state.distance + travellerOffset(hero.id), state);
    const y = travellerLane(hero.id) * this.scene.scale.height;
    figure.image
      .setFrame(String(this.heroPose(state, hero, reduced)))
      .setPosition(x, y)
      .setDisplaySize(size, size)
      .setDepth(10 + travellerLane(hero.id) * 10)
      .setAlpha(hero.hp > 0 ? 1 : 0.35);
    figure.label
      .setPosition(x, y + 13)
      .setText(travellerNames[hero.id] + (hero.hp <= 0 ? " · 戦闘不能" : ""));
    this.health(x, y + 4, size, hero.hp / hero.maxHp);
  }

  private paintEnemy(state: RoadBattle, enemy: RoadEnemy, reduced: boolean) {
    let figure = this.enemies.get(enemy.id);
    if (!figure) {
      figure = this.makeFigure("/sprites.png", "slime", enemy.boss ? "大きなスライム" : "");
      this.enemies.set(enemy.id, figure);
    }
    const size =
      Math.min(115, this.scene.scale.width * 0.19, this.scene.scale.height * 0.32) *
      (enemy.boss ? 1.65 : 0.75);
    const x = this.screenX(enemy.x, state),
      y = enemy.lane * this.scene.scale.height;
    const bounce = reduced ? 0 : Math.sin(state.time / 170 + enemy.id) * 3;
    figure.image
      .setPosition(x, y + bounce)
      .setDisplaySize(size, size)
      .setFlipX(true)
      .setDepth(10 + enemy.lane * 10);
    figure.label.setPosition(x, y + 14);
    this.health(x, y + 5, size, enemy.hp / enemy.maxHp, true);
  }

  private paintEffects(state: RoadBattle, reduced: boolean) {
    this.effects.clear();
    if (reduced) return;
    for (const item of state.effects) {
      if (state.time - item.at <= 450) this.paintEffect(state, item);
    }
  }

  private paintEffect(state: RoadBattle, item: RoadEffect) {
    const age = state.time - item.at;
    const x = this.screenX(item.x, state),
      y = item.lane * this.scene.scale.height - 32;
    this.effects.lineStyle(
      item.wide ? 4 : 2,
      item.kind === "hurt" ? 0xf09780 : 0xffe9ad,
      1 - age / 450,
    );
    if (item.kind === "arrow") {
      const start = this.screenX(state.distance - 32, state);
      const end = start + (x - start) * Math.min(1, age / 170);
      this.effects.lineBetween(end - 26, y, end, y);
    } else {
      this.effects.strokeCircle(x, y, 8 + age / (item.wide ? 9 : 22));
      this.effects.lineBetween(x - 15, y + 18, x + 15, y - 18);
    }
  }

  paint(state: RoadBattle, reduced: boolean) {
    this.scenery(state, reduced);
    this.bars.clear();
    for (const [id, figure] of this.enemies) {
      if (state.enemies.some((enemy) => enemy.id === id && enemy.hp > 0)) continue;
      figure.image.destroy();
      figure.label.destroy();
      this.enemies.delete(id);
    }
    for (const hero of state.heroes) this.paintHero(state, hero, reduced);
    for (const enemy of state.enemies) if (enemy.hp > 0) this.paintEnemy(state, enemy, reduced);
    this.paintEffects(state, reduced);
  }
}
