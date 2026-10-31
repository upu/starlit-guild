import type Phaser from "phaser";
import type { RoadLook } from "../../lib/road-look.ts";
import type { RoadBattle } from "../../lib/road-view.ts";
import type { RoadViewport } from "../../lib/road-cart-layout.ts";
import { roadFigureDepth } from "../../lib/road-layout.ts";
import { roadWorkFlip, roadWorkOrigin } from "../../lib/road-storybook-work.ts";

type WorkDraw = {
  x: number;
  y: number;
  lane: number;
  size: number;
  asset: string;
  frame: string;
  offset: number;
  depth?: number;
};

/** Hidden logical jobs have no atlas frame. Keep captions/progress without resolving that image. */
export function paintGroundWorkImage(
  image: Phaser.GameObjects.Image,
  look: RoadLook,
  point: NonNullable<RoadBattle["gathering"]>,
  view: RoadViewport,
  draw: WorkDraw,
) {
  if (!image.visible) return 0;
  if (image.texture.key !== draw.asset || image.frame.name !== draw.frame)
    image.setTexture(draw.asset, draw.frame);
  image
    .setOrigin(0.5, roadWorkOrigin(look, point.kind === "cargo"))
    .setPosition(draw.x, draw.y - draw.offset)
    .setScale(draw.size / image.frame.width)
    .setTint(look.night ? 0xd1d1d1 : 0xffffff)
    .setDepth(
      draw.depth ??
        (look.work?.frame === "earthwork" ? 2 : roadFigureDepth(draw.lane, view, look) - 0.1),
    )
    .setFlipX(roadWorkFlip(look, point));
  return image.displayHeight * (1 - image.originY);
}
