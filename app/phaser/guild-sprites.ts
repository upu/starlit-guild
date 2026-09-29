import type Phaser from "phaser";
import { guildPose, type GuildPoseKind } from "./guild-art";
import { guildMotion } from "@/lib/guild-stage-model";
import { guildRoomSprite } from "@/lib/guild-menu-model";
import type { guildRoomArt } from "@/lib/guild-room-art";
import type { TravellerId } from "@/lib/road-view";
export class GuildSprites {
  private objects = new Map<string, Phaser.GameObjects.Image>();
  constructor(readonly scene: Phaser.Scene) {}
  clear() {
    for (const object of this.objects.values()) object.setVisible(false);
  }
  image(key: string, asset: string, rect?: readonly number[]) {
    const name = rect?.join("-");
    const texture = this.scene.textures.get(asset);
    if (name && rect && !texture.has(name))
      texture.add(name, 0, rect[0], rect[1], rect[2], rect[3]);
    let image = this.objects.get(key);
    if (!image) {
      image = this.scene.add.image(0, 0, asset, name);
      this.objects.set(key, image);
    }
    image.setTexture(asset, name).setVisible(true).setAlpha(1).setAngle(0).setFlipX(false);
    return image;
  }
  place(image: Phaser.GameObjects.Image, x: number, y: number, width: number, depth = y) {
    const w = this.scene.scale.width,
      h = this.scene.scale.height;
    image
      .setOrigin(0.5, 1)
      .setPosition((x * w) / 1000, (y * h) / 750)
      .setDisplaySize(
        (width * w) / 1000,
        ((image.frame.height / image.frame.width) * width * w) / 1000,
      )
      .setDepth(depth);
    return image;
  }
  room(
    key: string,
    atlas: keyof typeof guildRoomArt,
    frame: number,
    point: { x: number; y: number; width: number },
    depth = point.y,
  ) {
    const sprite = guildRoomSprite(atlas, frame);
    return this.place(
      this.image(key, sprite.asset, sprite.rect),
      point.x,
      point.y,
      point.width,
      depth,
    );
  }
  actor(
    id: TravellerId,
    mode: GuildPoseKind,
    point: { x: number; y: number; left?: boolean },
    elapsed: number,
    reduced: boolean,
    height = 175,
  ) {
    const walkSpeed = id === "finn" || id === "lico" ? 80 : 160;
    const speed = mode === "walk" ? walkSpeed : 550;
    const step = mode === "tea" ? teaStep(elapsed) : Math.floor(elapsed / speed);
    const frame = guildPose(id, mode, reduced ? 0 : step);
    const motion = guildMotion(elapsed, mode === "walk", reduced);
    const image = this.place(
      this.image(`hero-${id}`, frame.asset, frame.rect),
      point.x,
      point.y,
      frame.rect[2] * frame.scale * height,
    );
    image.setFlipX(point.left ?? false).setAngle(motion.angle);
    image.y -= (motion.lift * this.scene.scale.width) / 1000;
    return image;
  }
}

function teaStep(elapsed: number) {
  const phase = elapsed % 10000;
  if (phase < 5000 || phase >= 8500) return 0;
  if (phase < 5800) return 1;
  return phase < 7600 ? 2 : 3;
}
