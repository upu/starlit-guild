import type Phaser from "phaser";
import {
  adventureFrame,
  adventureAssets,
  adventureAction,
  adventureHit,
  memberHealthLabel,
  spriteSize,
  type AdventureFrame,
} from "@/lib/adventure-presentation";
import type { AdventureBridge } from "./renderer-session";
import { heroSheets, heroAnimation } from "@/lib/hero-animation";
import { enemyTexture } from "./enemy-texture";
import { AdventureEffectsPainter } from "./adventure-painter-effects";
import {
  enemyAspect,
  enemyLabelColor,
  enemyWindup,
  makeFigure,
  memberAngle,
  memberBob,
  memberLunge,
  registerHeroFrames,
  removeFigure,
  type Figure,
  type Member,
  type RuntimeState,
} from "./adventure-painter-figures";

export class AdventurePainter {
  private background!: Phaser.GameObjects.Image;
  private shade!: Phaser.GameObjects.Graphics;
  private meters!: Phaser.GameObjects.Graphics;
  private ambient!: Phaser.GameObjects.Graphics;
  private figures = new Map<string, Figure>();
  private opponents = new Map<string, Figure>();
  private effects: AdventureEffectsPainter;
  private sceneKey = "";
  private backgroundKey = "";
  private loading = false;
  failed = false;

  constructor(
    private scene: Phaser.Scene,
    private bridge: AdventureBridge,
    private engine: typeof Phaser,
    private runtime: RuntimeState,
    private syncPause: () => void,
  ) {
    this.effects = new AdventureEffectsPainter(scene, runtime);
  }
  initialize() {
    if (this.runtime.disposed) return;
    if (this.failed) {
      this.bridge.status("error");
      return;
    }
    const atlas = this.scene.textures.get("/sprites.png"),
      source = atlas.getSourceImage() as HTMLImageElement;
    for (let i = 0; i < 12; i++)
      atlas.add(
        String(i),
        0,
        Math.round(((i % 4) * source.width) / 4),
        Math.round((Math.floor(i / 4) * source.height) / 3),
        Math.floor(source.width / 4),
        Math.floor(source.height / 3),
      );
    this.background = this.scene.add
      .image(0, 0, adventureFrame(this.bridge.read()).background)
      .setDepth(0);
    this.shade = this.scene.add.graphics().setDepth(1);
    this.ambient = this.scene.add.graphics().setDepth(2);
    this.meters = this.scene.add.graphics().setDepth(30);
    this.scene.input.on(this.engine.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.pointerUp(pointer);
    });
    this.scene.events.once(this.engine.Scenes.Events.SHUTDOWN, () => {
      this.clearEffects();
    });
    this.runtime.created = true;
    this.bridge.status("ready");
    this.paint();
    queueMicrotask(this.syncPause);
  }
  private pointerUp(pointer: Phaser.Input.Pointer) {
    if (
      this.runtime.disposed ||
      this.runtime.paused ||
      this.loading ||
      this.failed ||
      pointer.button !== 0 ||
      pointer.getDistance() > 14
    )
      return;
    const input = this.bridge.read(),
      frame = adventureFrame(input);
    const intent = adventureHit(
      frame,
      { x: pointer.x, y: pointer.y },
      this.scene.scale.width,
      this.scene.scale.height,
    );
    const action = adventureAction(input, intent);
    if (action) this.bridge.act(action);
  }
  private registerSheets() {
    for (const sheet of Object.values(heroSheets)) {
      if (!sheet) continue;
      const { asset } = sheet;
      if (!this.scene.textures.exists(asset)) continue;
      const texture = this.scene.textures.get(asset);
      if (texture.has("0")) continue;
      registerHeroFrames(texture, sheet);
    }
  }
  private ensureAssets(frame: AdventureFrame) {
    const missing = adventureAssets(frame).filter((asset) => !this.scene.textures.exists(asset));
    if (!missing.length) return true;
    if (this.loading) return false;
    this.loading = true;
    this.bridge.status("loading");
    for (const asset of missing) this.scene.load.image(asset, asset);
    this.scene.load.once(this.engine.Loader.Events.COMPLETE, () => {
      this.loading = false;
      if (!this.runtime.disposed && !this.failed) this.bridge.status("ready");
    });
    this.scene.load.start();
    return false;
  }
  clearEffects() {
    this.effects.clear();
  }
  stopMotion() {
    this.clearEffects();
    this.scene.cameras.main.resetFX();
  }
  private paintBackground(now: number, width: number, height: number) {
    const source = this.background.texture.getSourceImage() as HTMLImageElement,
      cover = Math.max(width / source.width, height / source.height) * 1.055;
    this.background
      .setScale(cover)
      .setPosition(
        width / 2 + (this.runtime.reduced ? 0 : Math.sin(now / 11000) * width * 0.009),
        height / 2,
      );
    this.shade.clear();
    for (let i = 0; i < 10; i++)
      this.shade.fillStyle(0x092c25, 0.35 * (1 - i / 10)).fillRect(0, i * 12, width, 12);
    this.shade.fillStyle(0x0b3028, 0.15).fillRect(0, height - 45, width, 45);
  }
  private paintAmbient(now: number, width: number, height: number) {
    this.ambient.clear();
    if (this.runtime.reduced) return;
    for (let i = 0; i < 12; i++) {
      const t = ((now / 1000 + i * 2.3) % 14) / 14;
      this.ambient
        .fillStyle(0xffefae, Math.sin(t * Math.PI) * 0.6)
        .fillCircle(
          (0.06 + ((i * 29) % 88) / 100) * width + Math.sin(t * 5 + i) * 12,
          height * (0.92 - t * 0.82),
          i % 3 === 0 ? 2 : 1,
        );
    }
  }
  private memberMotion(
    member: Member,
    now: number,
    size: number,
    index: number,
    pose: ReturnType<typeof heroAnimation>,
  ) {
    const animated = !!pose,
      bob = memberBob(member, now, index, this.runtime.reduced, animated);
    const front = ["melee", "rogue", "tank"].includes(member.role),
      attacking = !pose || (Number(pose.frame) >= 4 && Number(pose.frame) <= 7);
    const lunge = memberLunge(member, size, this.runtime.reduced, front, attacking),
      angle = memberAngle(member, now, index, this.runtime.reduced, animated, front);
    return {
      x: member.x * this.scene.scale.width + lunge,
      y: member.y * this.scene.scale.height + bob,
      angle,
    };
  }
  private paintMemberHealth(
    input: ReturnType<AdventureBridge["read"]>,
    frame: AdventureFrame,
    member: Member,
    figure: Figure,
    size: number,
  ) {
    if (!input.squad.run) return;
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      barWidth = Math.min(76, size * 0.78),
      barY = member.y * height + size * 0.12;
    this.meters
      .fillStyle(0x09271f, 0.85)
      .fillRoundedRect(member.x * width - barWidth / 2, barY, barWidth, 5, 2);
    this.meters
      .fillStyle(member.health < 0.3 ? 0xf2aa89 : 0xa8deb0, 1)
      .fillRoundedRect(member.x * width - barWidth / 2, barY, barWidth * member.health, 5, 2);
    figure.label.setY(barY + 9).setText(memberHealthLabel(member));
    if (frame.ward)
      this.meters
        .lineStyle(2, 0xb2def5, 0.65)
        .strokeEllipse(member.x * width, member.y * height - size * 0.35, size * 0.82, size * 1.02);
  }
  private paintMember(
    input: ReturnType<AdventureBridge["read"]>,
    frame: AdventureFrame,
    member: Member,
    index: number,
    now: number,
    size: number,
  ) {
    let figure = this.figures.get(member.id);
    if (!figure) {
      figure = makeFigure(this.scene, member.sprite, member.name);
      this.figures.set(member.id, figure);
    }
    const pose = heroSheets[member.id]?.ready
      ? heroAnimation(member, frame, now, this.runtime.reduced)
      : null;
    if (pose) figure.image.setTexture(pose.asset, pose.frame);
    const artSize = pose ? size * 1.12 : size,
      motion = this.memberMotion(member, now, size, index, pose);
    figure.image
      .setPosition(motion.x, motion.y)
      .setDisplaySize(artSize, artSize)
      .setAngle(motion.angle)
      .setDepth(10 + member.y * 10)
      .setAlpha(frame.phase === "rest" || member.down ? 0.55 : 1);
    figure.shadow
      .setPosition(member.x * this.scene.scale.width, member.y * this.scene.scale.height + 3)
      .setDisplaySize(size * 0.55, size * 0.1);
    figure.label
      .setPosition(
        member.x * this.scene.scale.width,
        member.y * this.scene.scale.height + size * 0.13,
      )
      .setText(member.name);
    const hurt = frame.events.some(
      (e) => e.kind === "hurt" && e.target === member.id && now - e.at < 130,
    );
    if (hurt && !this.runtime.reduced) figure.image.setTint(0xffb2a2);
    else figure.image.clearTint();
    this.paintMemberHealth(input, frame, member, figure, size);
  }
  private paintMembers(
    input: ReturnType<AdventureBridge["read"]>,
    frame: AdventureFrame,
    now: number,
    size: number,
  ) {
    for (const [id, figure] of this.figures)
      if (!frame.members.some((m) => m.id === id)) {
        removeFigure(figure);
        this.figures.delete(id);
      }
    this.meters.clear();
    for (let index = 0; index < frame.members.length; index++)
      this.paintMember(input, frame, frame.members[index], index, now, size);
  }
  private paintTarget(frame: AdventureFrame, now: number, size: number) {
    const living = frame.targets.filter((target) => !target.down);
    for (const [id, figure] of this.opponents)
      if (!living.some((target) => target.id === id)) {
        removeFigure(figure);
        this.opponents.delete(id);
      }
    for (const target of living) this.paintOpponent(frame, target, now, size);
  }
  private paintOpponent(
    frame: AdventureFrame,
    target: AdventureFrame["targets"][number],
    now: number,
    size: number,
  ) {
    let opponent = this.opponents.get(target.id);
    if (!opponent) {
      opponent = makeFigure(this.scene, target.sprite, target.name);
      this.opponents.set(target.id, opponent);
    }
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      asset = target.asset;
    opponent.image.setTexture(
      enemyTexture(this.scene.textures, asset, size * target.scale),
      asset === "/sprites.png" ? String(target.sprite) : undefined,
    );
    const enemySize = size * target.scale,
      pulse = this.runtime.reduced ? 1 : 1 + Math.sin(now / 420) * 0.015,
      events = frame.events.filter((event) => !event.enemy || event.enemy === target.id);
    const hurt = events.some(
        (e) => ["hit", "assist", "skill", "combo"].includes(e.kind) && now - e.at < 140,
      ),
      striking = events.find((e) => e.kind === "hurt" && now - e.at < 320);
    const offset =
        striking && !this.runtime.reduced
          ? -Math.sin(((now - striking.at) / 320) * Math.PI) * 12
          : 0,
      windup = enemyWindup(target.cue, this.runtime.reduced, now);
    opponent.image
      .setPosition(target.x * width + offset, target.y * height - Math.abs(windup))
      .setAngle(windup)
      .setDisplaySize(enemySize * pulse * enemyAspect(asset), enemySize / pulse)
      .setFlipX(target.battle)
      .setDepth(10 + target.y * 10);
    if (hurt && !this.runtime.reduced) opponent.image.setTint(0xffedb1);
    else opponent.image.clearTint();
    opponent.shadow
      .setPosition(target.x * width, target.y * height + 3)
      .setDisplaySize(enemySize * 0.6, enemySize * 0.12);
    opponent.label
      .setText(target.cue || target.name)
      .setColor(enemyLabelColor(target.cue))
      .setFontSize(width < 500 ? 12 : 13)
      .setWordWrapWidth(Math.min(180, width * 0.27), true)
      .setPosition(
        Math.min(width - Math.min(180, width * 0.27) / 2 - 6, target.x * width),
        target.y * height + enemySize * 0.13 + 10,
      );
    const bar = Math.min(92, enemySize * 0.8),
      y = target.y * height + enemySize * 0.12;
    this.meters.fillStyle(0x17352e, 0.9).fillRoundedRect(target.x * width - bar / 2, y, bar, 5, 2);
    this.meters
      .fillStyle(target.battle ? 0xf1b38e : 0xe9d89a)
      .fillRoundedRect(target.x * width - bar / 2, y, bar * target.value, 5, 2);
  }
  paint() {
    const input = this.bridge.read(),
      now = input.now,
      frame = adventureFrame(input),
      width = this.scene.scale.width,
      height = this.scene.scale.height;
    if (!this.ensureAssets(frame)) return;
    this.registerSheets();
    if (frame.key !== this.sceneKey) {
      this.clearEffects();
      this.sceneKey = frame.key;
    }
    if (frame.background !== this.backgroundKey) {
      this.background.setTexture(frame.background);
      this.backgroundKey = frame.background;
    }
    this.paintBackground(now, width, height);
    this.paintAmbient(now, width, height);
    const size = spriteSize(width, height, frame.phase === "idle");
    this.paintMembers(input, frame, now, size);
    this.paintTarget(frame, now, size);
    this.effects.paintEvents(frame, now);
    this.effects.paintCutin(input, frame);
  }
}
