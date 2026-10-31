import type Phaser from "phaser";
import type { HandheldItem, HandheldView } from "@/lib/road-handheld";
import { handheldPoint, handheldWidth } from "@/lib/road-handheld";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import { roadFigureDepth, roadX, roadY } from "@/lib/road-layout";
import type { RoadLook } from "@/lib/road-look";
import { picnicAssets } from "@/lib/road-picnic";

const itemAsset = (kind: HandheldItem["kind"]) => {
  if (kind === "transplant-basket") return "/storybook-study/loading-basket-v1.webp";
  if (kind === "field-basket") return "/storybook-study/field-basket-v1.webp";
  if (kind === "field-medicine") return "/storybook-study/visiting-satchel-v1.webp";
  if (kind === "field-paper") return "/storybook-study/shipping-record-v1.webp";
  if (kind === "medicine-parcel") return "/storybook-study/medicine-packet-v1.webp";
  if (kind === "lunch-bag") return picnicAssets.bag;
  if (kind === "bread-parcel") return picnicAssets.bread;
  if (kind === "moss-jar" || kind === "forest-moss-jar") return "/storybook-study/moss-jar-v1.webp";
  return `/storybook-study/homeward-${kind === "medicine" ? "medicine" : "bottles"}-v1.webp`;
};

export class RoadHandheldProps {
  readonly points = new Map<string, { x: number; lane: number }>();
  private images = new Map<string, Phaser.GameObjects.Image>();
  private jarShadow?: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {}
  begin() {
    this.points.clear();
    this.jarShadow?.clear();
    for (const image of this.images.values()) image.setVisible(false);
  }
  paint(
    hero: Traveller,
    item: HandheldItem,
    frame: number,
    state: RoadBattle,
    view: HandheldView,
    look?: RoadLook,
  ) {
    const point =
      item.phase === "ground" ? item.point : handheldPoint(item, hero, frame, view, state.stage);
    if (!point) return;
    this.points.set(hero.id, point);
    let image = this.images.get(hero.id);
    if (!image) {
      image = this.scene.add.image(0, 0, itemAsset(item.kind)).setOrigin(0.5, 1);
      this.images.set(hero.id, image);
    }
    image.setTexture(itemAsset(item.kind));
    const size = handheldWidth(item.kind, view, item.sizeScale),
      ground = item.phase === "ground";
    const source = image.texture.getSourceImage() as HTMLImageElement;
    this.paintJarShadow(item, point, state, view, size);
    image
      .setVisible(true)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setFlipX((ground ? item.facing : hero.facing) < 0)
      .setPosition(
        roadX(point.x, state.distance, view.width, state.stage),
        roadY(point.lane, view.height, view.width),
      )
      .setDepth(
        look?.mossBeds?.records
          ? ground
            ? roadFigureDepth(point.lane, view, look) - 0.05
            : roadFigureDepth(hero.lane, view, look) + 0.015
          : ground
            ? 10 + point.lane * 10 - 0.05
            : 10 + hero.lane * 10 + 0.015,
      );
  }
  private paintJarShadow(
    item: HandheldItem,
    point: { x: number; lane: number },
    state: RoadBattle,
    view: HandheldView,
    size: number,
  ) {
    if (!["moss-jar", "forest-moss-jar"].includes(item.kind) || item.phase !== "ground") return;
    this.jarShadow ??= this.scene.add.graphics();
    this.jarShadow
      .setDepth(10 + point.lane * 10 - 0.08)
      .fillStyle(0x15291e, 0.28)
      .fillEllipse(
        roadX(point.x, state.distance, view.width, state.stage),
        roadY(point.lane, view.height, view.width) + 1,
        size * 0.8,
        size * 0.24,
      );
  }
}
