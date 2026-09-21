import type Phaser from "phaser";

// A gold pulse runs along a bowed control thread, then lights up its recipient.
export function paintCommand(
  thread: Phaser.GameObjects.Graphics,
  sprite: Phaser.GameObjects.Image,
  from: { x: number; y: number },
  to: { x: number; y: number },
  age: number,
  scale: number,
  reduced: boolean,
) {
  const progress = reduced ? 1 : Math.min(1, age / 460);
  const alpha = reduced ? 0.7 : Math.min(1, age / 70) * Math.min(1, (900 - age) / 260);
  const bend = Math.min(65 * scale, Math.hypot(to.x - from.x, to.y - from.y) * 0.28);
  const point = (t: number) => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * bend,
  });
  thread.lineStyle(Math.max(1, scale * 1.5), 0xffdb91, alpha * 0.65);
  thread.beginPath();
  thread.moveTo(from.x, from.y);
  for (let i = 1; i <= 24; i++) {
    const p = point((i / 24) * progress);
    thread.lineTo(p.x, p.y);
  }
  thread.strokePath();
  const pulse = point(progress);
  const arrival = reduced ? 0.5 : Math.max(0, (age - 460) / 440);
  sprite.setPosition(pulse.x, pulse.y).setTint(0xffd080);
  sprite.setDisplaySize((62 + arrival * 38) * scale, (62 + arrival * 38) * scale);
  sprite.setAlpha(alpha);
  if (progress === 1) {
    thread.lineStyle(2 * scale, 0xffe3a4, alpha * (1 - arrival));
    thread.strokeEllipse(to.x, to.y, (24 + arrival * 42) * scale, (32 + arrival * 48) * scale);
  }
}
