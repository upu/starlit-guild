import type Phaser from "phaser";
import type { GameEvent } from "@/lib/game";
import { eventColor, spriteSize, type AdventureFrame } from "@/lib/adventure-presentation";
import type { AdventureBridge } from "./renderer-session";
import { PAINTER_FONT, type Member, type RuntimeState } from "./adventure-painter-figures";

export class AdventureEffectsPainter {
  private effects = new Set<Phaser.GameObjects.GameObject>();
  private seen = new Map<string, number>();
  private cutinKey = "";

  constructor(
    private scene: Phaser.Scene,
    private runtime: RuntimeState,
  ) {}
  clear() {
    for (const effect of this.effects) {
      this.scene.tweens.killTweensOf(effect);
      effect.destroy();
    }
    this.effects.clear();
    this.seen.clear();
  }
  private transient(
    object: Phaser.GameObjects.GameObject,
    properties: Record<string, unknown>,
    duration: number,
  ) {
    if (this.effects.size >= 64) {
      object.destroy();
      return;
    }
    this.effects.add(object);
    this.scene.tweens.add({
      targets: object,
      ...properties,
      duration: Math.max(60, duration),
      ease: "Cubic.Out",
      onComplete: () => {
        this.effects.delete(object);
        object.destroy();
      },
    });
  }
  private amountEffect(
    event: GameEvent,
    frame: AdventureFrame,
    x: number,
    y: number,
    color: number,
    age: number,
  ) {
    if (!event.amount) return;
    const positive =
      event.kind === "heal" ||
      event.kind === "gather" ||
      (event.kind === "assist" && !frame.target?.battle);
    const text = this.scene.add
      .text(
        x + ((this.seen.size % 3) - 1) * 15,
        y - 18,
        (positive ? "+" : "−") + String(event.amount),
        {
          fontFamily: PAINTER_FONT,
          fontSize: "23px",
          fontStyle: "bold",
          color: "#" + color.toString(16).padStart(6, "0"),
          stroke: "#123229",
          strokeThickness: 5,
        },
      )
      .setOrigin(0.5)
      .setDepth(55);
    this.transient(text, { y: y - (this.runtime.reduced ? 18 : 58), alpha: 0 }, 1000 - age);
  }
  private rangedEffect(
    frame: AdventureFrame,
    actor: Member,
    support: boolean,
    x: number,
    y: number,
    color: number,
    age: number,
  ) {
    if (
      !["ranged", "mage", "bard", "healer"].includes(actor.role) ||
      support ||
      !frame.target?.battle
    )
      return false;
    const bolt = this.scene.add
      .circle(
        actor.x * this.scene.scale.width,
        actor.y * this.scene.scale.height - 40,
        actor.role === "mage" ? 7 : 3,
        color,
      )
      .setDepth(46);
    this.transient(bolt, { x, y, alpha: 0.1 }, Math.max(100, 350 - age));
    return true;
  }
  private slashEffect(
    event: GameEvent,
    frame: AdventureFrame,
    support: boolean,
    x: number,
    y: number,
    age: number,
  ) {
    if (support || !frame.target?.battle) return;
    const slash = this.scene.add.graphics().setPosition(x, y).setDepth(49);
    slash.lineStyle(event.kind === "skill" ? 6 : 3, 0xfff9e4, 0.95).lineBetween(-25, 20, 25, -20);
    this.transient(slash, { scaleX: 1.6, scaleY: 1.4, alpha: 0 }, 350 - age);
  }
  private strikeEffect(
    event: GameEvent,
    frame: AdventureFrame,
    actor: Member,
    support: boolean,
    x: number,
    y: number,
    color: number,
    age: number,
  ) {
    if (this.runtime.reduced || age > 650) return;
    const size = event.kind === "skill" ? 27 : 17,
      ring = this.scene.add.circle(x, y, size).setStrokeStyle(2, color, 0.95).setDepth(48);
    this.transient(ring, { scale: 2.2, alpha: 0 }, 550 - age);
    if (this.rangedEffect(frame, actor, support, x, y, color, age)) return;
    this.slashEffect(event, frame, support, x, y, age);
  }
  private moteEffects(support: boolean, x: number, y: number, color: number, age: number) {
    if (this.runtime.reduced || age > 650) return;
    for (let index = 0; index < 5; index++) {
      const angle = (index * Math.PI * 2) / 5,
        mote = this.scene.add.circle(x, y, 2 + (index % 2), color).setDepth(47);
      this.transient(
        mote,
        {
          x: x + Math.cos(angle) * 45,
          y: y + Math.sin(angle) * 35 - (support ? 20 : 0),
          alpha: 0,
        },
        650 - age,
      );
    }
  }
  private eventEffect(event: GameEvent, frame: AdventureFrame, now: number) {
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      age = now - event.at,
      actor = frame.members.find((member) => member.id === event.hero) || frame.members[0],
      support =
        event.kind === "heal" || event.kind === "hurt" || (event.kind === "skill" && !event.amount),
      destination =
        frame.members.find((member) => member.id === event.target) ||
        (support
          ? actor
          : frame.targets.find((target) => target.id === event.enemy) || frame.target);
    if (!destination) return;
    const x = destination.x * width,
      y = destination.y * height - spriteSize(width, height) * 0.45,
      color = eventColor(event);
    this.amountEffect(event, frame, x, y, color, age);
    this.strikeEffect(event, frame, actor, support, x, y, color, age);
    this.moteEffects(support, x, y, color, age);
  }
  paintEvents(frame: AdventureFrame, now: number) {
    for (const [id, at] of this.seen) if (now - at > 2000) this.seen.delete(id);
    for (const event of frame.events) {
      if (this.seen.has(event.id)) continue;
      this.seen.set(event.id, event.at);
      if (["hit", "skill", "heal", "hurt", "combo", "assist", "gather"].includes(event.kind))
        this.eventEffect(event, frame, now);
    }
  }
  paintCutin(input: ReturnType<AdventureBridge["read"]>, frame: AdventureFrame) {
    if (!frame.cutin) return;
    const key = input.squad.id + ":" + frame.cutin.kind + ":" + String(frame.cutin.at);
    if (key === this.cutinKey) return;
    this.cutinKey = key;
    if (this.runtime.reduced) return;
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      wave = this.scene.add
        .circle(width * 0.65, height * 0.55, 30)
        .setStrokeStyle(4, 0xffe3a0, 0.9)
        .setDepth(45);
    this.transient(wave, { scale: Math.max(width, height) / 40, alpha: 0 }, 700);
  }
}
