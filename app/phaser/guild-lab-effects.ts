import type Phaser from "phaser";
import type { LabFeeling, LabMark } from "@/lib/guild-lab-affection";
import { LAB_ACTOR_SCALE, type LabPose, type Point } from "@/lib/guild-lab-model";

const glyphs = { note: "♪", notice: "!", sweat: "", sleep: "z Z", heart: "♥", thought: "…" };
const colors = {
  note: "#8b5923",
  notice: "#bc7833",
  sweat: "#4794ad",
  sleep: "#7278a3",
  heart: "#c35e7f",
  thought: "#8a718b",
};
export class GuildLabEffects {
  private mark: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private drops: Phaser.GameObjects.Graphics;
  private steam: Phaser.GameObjects.Particles.ParticleEmitter;
  private chips: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastEmit = 0;
  private previous: LabMark = null;
  private fading = -Infinity;
  private appeared = 0;
  constructor(
    private scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
  ) {
    this.textures();
    this.steam = scene.add.particles(0, 0, "lab-steam", {
      emitting: false,
      lifespan: 1100,
      speedY: { min: -16, max: -10 },
      speedX: { min: -3, max: 3 },
      alpha: { start: 0.3, end: 0 },
      scale: { start: 0.5, end: 1 },
      maxParticles: 12,
    });
    this.chips = scene.add.particles(0, 0, "lab-chip", {
      emitting: false,
      lifespan: 500,
      speedY: { min: -17, max: -7 },
      speedX: { min: -13, max: 13 },
      gravityY: 45,
      alpha: { start: 0.8, end: 0 },
      rotate: { min: 0, max: 180 },
      maxParticles: 8,
    });
    this.mark = scene.add.container(43, -179);
    const bubble = scene.add
      .graphics()
      .fillStyle(0xfff4d5, 0.95)
      .fillCircle(0, 0, 13)
      .lineStyle(1, 0xc6a873, 0.9)
      .strokeCircle(0, 0, 13);
    this.text = scene.add
      .text(0, -1, "", {
        fontFamily: "Georgia, serif",
        fontSize: 22,
        fontStyle: "bold",
        color: "#8b5923",
      })
      .setOrigin(0.5)
      .setResolution(3);
    this.drops = scene.add.graphics().fillStyle(0x62b7cd);
    this.drops
      .fillTriangle(-5, -8, -10, 1, -1, 1)
      .fillCircle(-5, 2, 4.5)
      .fillTriangle(6, -3, 2, 5, 10, 5)
      .fillCircle(6, 6, 4);
    this.mark.add([bubble, this.text, this.drops]);
    root.add([this.steam, this.chips, this.mark]);
  }
  private textures() {
    if (this.scene.textures.exists("lab-steam")) return;
    const brush = this.scene.make.graphics({ x: 0, y: 0 });
    brush.fillStyle(0xfff9e7).fillEllipse(3, 8, 3, 14).generateTexture("lab-steam", 6, 16);
    brush.clear().fillStyle(0xe9bb66).fillRect(0, 0, 4, 2).generateTexture("lab-chip", 4, 2);
    brush.destroy();
  }
  paint(
    time: number,
    mode: LabPose,
    feeling: LabFeeling,
    reduced: boolean,
    paused: boolean,
    cup: Point,
    left: boolean,
  ) {
    this.symbol(time, feeling, reduced, left);
    this.steam.setActive(!reduced && !paused);
    this.chips.setActive(!reduced && !paused);
    if (reduced) {
      this.steam.killAll();
      this.chips.killAll();
      return;
    }
    if (paused || time - this.lastEmit < 200) return;
    this.lastEmit = time;
    if (mode === "tea") this.steam.emitParticleAt(cup.x, cup.y - 3, 1);
    if (mode === "work" && feeling.expression === "serious") this.chips.emitParticleAt(28, -67, 1);
  }
  private symbol(time: number, feeling: LabFeeling, reduced: boolean, left: boolean) {
    if (feeling.mark !== this.previous) {
      this.previous = feeling.mark;
      this.appeared = time;
      if (!feeling.mark) this.fading = time;
    }
    if (!feeling.mark) {
      this.mark.visible = !reduced && time - this.fading < 180;
      this.mark.alpha = Math.max(0, 1 - (time - this.fading) / 180);
      return;
    }
    this.mark.visible = true;
    this.mark.alpha = 1;
    this.text.setText(glyphs[feeling.mark]).setColor(colors[feeling.mark]);
    this.drops.visible = feeling.mark === "sweat";
    const age = (time - this.appeared) / 350;
    const pop = reduced ? 1 : age < 1 ? 1 + Math.sin(age * Math.PI) * 0.2 : 1;
    const density = this.scene.game.canvas.width / this.scene.game.canvas.clientWidth;
    const scale = Math.max(
      1,
      16 / ((26 * LAB_ACTOR_SCALE * this.scene.cameras.main.zoom) / density),
    );
    this.mark.setScale((left ? -1 : 1) * scale * pop, scale * pop);
    this.mark.y = -179 - (reduced ? 0 : Math.sin(Math.min(1, age) * Math.PI) * 4);
  }
}
