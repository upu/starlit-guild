import type Phaser from "phaser";

export function drawLabJoints(
  joints: Phaser.GameObjects.Graphics,
  root: Phaser.GameObjects.Components.TransformMatrix,
  limbs: { upper: Phaser.GameObjects.Container; lower: Phaser.GameObjects.Container }[],
) {
  joints.lineStyle(1, 0x78fff1, 0.9);
  for (const limb of limbs.filter((p) => p.upper.visible)) {
    const upper = limb.upper.getWorldTransformMatrix(),
      lower = limb.lower.getWorldTransformMatrix();
    const a = root.applyInverse(upper.tx, upper.ty),
      b = root.applyInverse(lower.tx, lower.ty);
    joints.lineBetween(a.x, a.y, b.x, b.y).strokeCircle(a.x, a.y, 2).strokeCircle(b.x, b.y, 2);
  }
}
