import type Phaser from "phaser";
import type { RoadBattle, RoadEffect } from "@/lib/road-view";
import { ROAD_EFFECTS } from "./road-art";
import { adventureMushroomProjectile } from "@/lib/adventure-enemy-art";
import { roadY } from "@/lib/road-layout";
import { RPG_CAMERA_SCALE } from "@/lib/rpg-camera";
import { paintCommand } from "./road-command-effect";
import { duelEffect, paintDuelEffect } from "./road-duel-effects";
import { paintPaintedEffect } from "./road-painted-effects";

const frames = {
  arrow: 0,
  slash: 1,
  magic: 2,
  heal: 2,
  gather: 3,
  assist: 1,
  hurt: 1,
  command: 2,
  mushroomThrow: 3,
  song: 2,
  paralyze: 2,
};

function resetLegacyEffect(sprite: Phaser.GameObjects.Image, kind: RoadEffect["kind"]) {
  sprite
    .setTexture(ROAD_EFFECTS, String(frames[kind]))
    .setDepth(40)
    .setOrigin(0.5)
    .setFlipX(false)
    .setRotation(0);
}

function effectPoints(
  effect: RoadEffect,
  view: { width: number; height: number },
  screenX: (x: number) => number,
  scale: number,
  smallSongTarget: boolean,
) {
  const y = (lane: number) => roadY(lane, view.height, view.width);
  return {
    start: {
      x: screenX(effect.fromX ?? effect.x),
      y: y(effect.fromLane ?? effect.lane) - 28 * scale,
    },
    end: { x: screenX(effect.x), y: y(effect.lane) - (smallSongTarget ? 14 : 24) * scale },
  };
}

function isSmallSongTarget(state: RoadBattle, effect: RoadEffect, seedlingBattle: boolean) {
  return (
    seedlingBattle &&
    effect.kind === "song" &&
    state.enemies.some(
      (enemy) => enemy.kind === "mushroom" && enemy.x === effect.x && enemy.lane === effect.lane,
    )
  );
}

export class RoadEffects {
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private threads: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    if (scene.textures.exists(adventureMushroomProjectile))
      scene.textures.get(adventureMushroomProjectile).setFilter(0);
    this.threads = scene.add.graphics().setDepth(39);
    const texture = scene.textures.get(ROAD_EFFECTS);
    const source = texture.getSourceImage() as HTMLImageElement;
    const side = Math.floor(source.width / 2);
    for (let index = 0; index < 4; index++)
      texture.add(String(index), 0, (index % 2) * side, Math.floor(index / 2) * side, side, side);
  }

  paint(
    state: RoadBattle,
    reduced: boolean,
    screenX: (x: number) => number,
    storybook = false,
    seedlingBattle = false,
  ) {
    this.threads.clear();
    const visible = state.effects.filter(
      (effect) =>
        (!reduced || effect.kind === "command" || effect.kind === "song") &&
        effect.kind !== "hurt" &&
        state.time >= effect.at &&
        state.time - effect.at <
          (duelEffect(effect.kind) ? 1800 : effect.kind === "command" ? 900 : 600),
    );
    for (const [id, sprite] of this.sprites) {
      if (visible.some((effect) => effect.id === id)) continue;
      sprite.destroy();
      this.sprites.delete(id);
    }
    for (const effect of visible)
      this.paintOne(state, effect, screenX, reduced, storybook, seedlingBattle);
  }

  private paintOne(
    state: RoadBattle,
    effect: RoadEffect,
    screenX: (x: number) => number,
    reduced: boolean,
    storybook: boolean,
    seedlingBattle: boolean,
  ) {
    let sprite = this.sprites.get(effect.id);
    if (!sprite) {
      sprite = this.scene.add.image(0, 0, ROAD_EFFECTS, String(frames[effect.kind])).setDepth(40);
      this.sprites.set(effect.id, sprite);
    }
    if (
      storybook &&
      paintPaintedEffect(
        sprite,
        state,
        effect,
        this.scene.scale.width,
        this.scene.scale.height,
        screenX,
      )
    )
      return;
    resetLegacyEffect(sprite, effect.kind);
    const age = state.time - effect.at;
    const scale = RPG_CAMERA_SCALE * Math.min(1, this.scene.scale.width / 620);
    const smallSongTarget = isSmallSongTarget(state, effect, seedlingBattle);
    const { start, end } = effectPoints(effect, this.scene.scale, screenX, scale, smallSongTarget);
    if (
      this.paintDuel(
        sprite,
        effect,
        age,
        scale,
        start,
        end,
        reduced,
        seedlingBattle,
        smallSongTarget,
      )
    )
      return;
    if (effect.kind === "command") {
      paintCommand(
        this.threads,
        sprite,
        { x: start.x, y: start.y - 10 * scale },
        end,
        age,
        scale,
        reduced,
      );
      return;
    }
    paintLegacyEffect(sprite, effect, age, scale, start, end);
  }
  private paintDuel(
    sprite: Phaser.GameObjects.Image,
    effect: RoadEffect,
    age: number,
    scale: number,
    start: { x: number; y: number },
    end: { x: number; y: number },
    reduced: boolean,
    seedlingBattle: boolean,
    smallSongTarget: boolean,
  ) {
    return paintDuelEffect(
      this.threads,
      sprite,
      effect,
      age,
      scale,
      start.x,
      start.y,
      end.x,
      end.y,
      reduced,
      seedlingBattle,
      smallSongTarget,
    );
  }
}

function paintLegacyEffect(
  sprite: Phaser.GameObjects.Image,
  effect: RoadEffect,
  age: number,
  scale: number,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const projectile = effect.kind === "arrow" || effect.kind === "magic";
  sprite.setTint(effect.hero === "lico" ? 0xe6f38b : 0xffffff);
  const progress = projectile ? Math.min(1, age / 240) : 1;
  sprite.setPosition(
    start.x + (end.x - start.x) * progress,
    start.y + (end.y - start.y) * progress,
  );
  const size = (effect.wide ? 145 : 110) * scale;
  sprite.setDisplaySize(size, size).setAlpha(Math.min(1, age / 60) * (1 - age / 600));
  if (effect.kind === "arrow") sprite.setRotation(Math.atan2(end.y - start.y, end.x - start.x));
  if (effect.kind === "slash")
    sprite.setFlipX(end.x < start.x).setRotation((age / 600 - 0.5) * 0.6);
}
