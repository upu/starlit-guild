import type Phaser from "phaser";
import type { PaintedEnemyPose } from "@/lib/road-storybook-enemy";

export function fitPaintedEnemy(
  image: Phaser.GameObjects.Image,
  pose: PaintedEnemyPose,
  size: number,
) {
  const texture = image.scene.textures.get(pose.asset);
  if (!texture.has("0")) {
    for (let frame = 0; frame < pose.rows * 4; frame++)
      texture.add(
        String(frame),
        0,
        (frame % 4) * pose.cell,
        Math.floor(frame / 4) * pose.cell,
        pose.cell,
        pose.cell,
      );
    texture.setFilter(1);
  }
  image
    .setTexture(pose.asset, pose.frame)
    .setOrigin(0.5, pose.foot / pose.cell)
    .setScale(size / pose.height)
    .setAngle(0);
}
