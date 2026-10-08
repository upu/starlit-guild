import type Phaser from "phaser";
import { spriteAsset, spriteFrame, type AdventureFrame } from "@/lib/adventure-presentation";
import { heroSheets } from "@/lib/hero-animation";
import { adventureEnemyArt } from "@/lib/adventure-enemy-art";

export type Figure = {
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
};
export type RuntimeState = {
  disposed: boolean;
  paused: boolean;
  created: boolean;
  reduced: boolean;
};
export type Member = AdventureFrame["members"][number];
export const PAINTER_FONT = '"Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';

export function memberBob(
  member: Member,
  now: number,
  index: number,
  reduced: boolean,
  animated: boolean,
) {
  if (reduced || animated) return 0;
  return Math.sin(now / (member.walking ? 85 : 550) + index * 2) * (member.walking ? 4 : 1.7);
}
export function memberLunge(
  member: Member,
  size: number,
  reduced: boolean,
  front: boolean,
  attacking: boolean,
) {
  return !reduced && front && attacking ? member.attack * size * 0.18 : 0;
}
export function memberAngle(
  member: Member,
  now: number,
  index: number,
  reduced: boolean,
  animated: boolean,
  front: boolean,
) {
  if (reduced || animated) return 0;
  if (member.walking) return Math.sin(now / 100 + index) * 3;
  return front ? member.attack * -7 : 0;
}
export const enemyLabelColor = (cue: string) => (cue ? "#ffe58c" : "#fff1cf");
export const enemyWindup = (cue: string, reduced: boolean, now: number) =>
  cue && !reduced ? Math.sin(now / 140) * 4 : 0;
export const enemyAspect = (asset: string) => (asset.startsWith("/enemies/") ? 2 / 3 : 1);
export function enemyCell(asset: string, height: number) {
  const restyled = asset.startsWith("/adventure-enemies/");
  return {
    size: restyled ? (height * adventureEnemyArt.cell) / adventureEnemyArt.height : height,
    origin: restyled ? adventureEnemyArt.foot / adventureEnemyArt.cell : 0.9,
  };
}

export function registerHeroFrames(
  texture: Phaser.Textures.Texture,
  sheet: NonNullable<(typeof heroSheets)[string]>,
) {
  if (sheet.frames) {
    sheet.frames.forEach(([x, y, width, height], index) =>
      texture
        .add(String(index), 0, x, y, width, height)
        ?.setTrim(420, 420, (420 - width) / 2, 378 - height, width, height),
    );
    return;
  }
  const source = texture.getSourceImage() as HTMLImageElement,
    width = source.width / sheet.columns,
    height = source.height / sheet.rows;
  for (let index = 0; index < sheet.columns * sheet.rows; index++)
    texture.add(
      String(index),
      0,
      Math.round((index % sheet.columns) * width),
      Math.round(Math.floor(index / sheet.columns) * height),
      Math.floor(width),
      Math.floor(height),
    );
}
export function makeFigure(scene: Phaser.Scene, index: number, name: string): Figure {
  const asset = spriteAsset(index);
  return {
    image: scene.add.image(0, 0, asset, spriteFrame(index)).setOrigin(0.5, 0.9),
    shadow: scene.add.ellipse(0, 0, 60, 12, 0x092821, 0.28).setDepth(4),
    label: scene.add
      .text(0, 0, name, {
        fontFamily: PAINTER_FONT,
        fontSize: "12px",
        color: "#fff1cf",
        stroke: "#132e27",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(31),
  };
}
export function removeFigure(figure: Figure) {
  figure.image.destroy();
  figure.shadow.destroy();
  figure.label.destroy();
}
