import type Phaser from "phaser";
import { heroes, type GameEvent } from "@/lib/game";
import {
  adventureFrame,
  adventureAssets,
  adventureAction,
  adventureHit,
  eventColor,
  memberHealthLabel,
  spriteAsset,
  spriteFrame,
  spriteSize,
  type AdventureFrame,
} from "@/lib/adventure-presentation";
import type { AdventureBridge } from "./renderer-session";
import { heroSheets, heroAnimation } from "@/lib/hero-animation";
import { enemyTexture } from "./enemy-texture";

type Figure = {
  image: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
};
type RuntimeState = { disposed: boolean; paused: boolean; created: boolean; reduced: boolean };
type Member = AdventureFrame["members"][number];
const font = '"Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
function memberBob(
  member: Member,
  now: number,
  index: number,
  reduced: boolean,
  animated: boolean,
) {
  if (reduced || animated) return 0;
  return Math.sin(now / (member.walking ? 85 : 550) + index * 2) * (member.walking ? 4 : 1.7);
}
function memberLunge(
  member: Member,
  size: number,
  reduced: boolean,
  front: boolean,
  attacking: boolean,
) {
  return !reduced && front && attacking ? member.attack * size * 0.18 : 0;
}
function memberAngle(
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

const enemyLabelColor = (cue: string) => (cue ? "#ffe58c" : "#fff1cf");
const enemyWindup = (cue: string, reduced: boolean, now: number) =>
  cue && !reduced ? Math.sin(now / 140) * 4 : 0;
const enemyAspect = (asset: string) => (asset.startsWith("/enemies/") ? 2 / 3 : 1);
function registerHeroFrames(
  texture: Phaser.Textures.Texture,
  sheet: NonNullable<(typeof heroSheets)[string]>,
) {
  if (sheet.frames) {
    sheet.frames.forEach(([x, y, w, h], index) =>
      texture.add(String(index), 0, x, y, w, h)?.setTrim(420, 420, (420 - w) / 2, 378 - h, w, h),
    );
    return;
  }
  const source = texture.getSourceImage() as HTMLImageElement,
    w = source.width / sheet.columns,
    h = source.height / sheet.rows;
  for (let i = 0; i < sheet.columns * sheet.rows; i++)
    texture.add(
      String(i),
      0,
      Math.round((i % sheet.columns) * w),
      Math.round(Math.floor(i / sheet.columns) * h),
      Math.floor(w),
      Math.floor(h),
    );
}
export class AdventurePainter {
  private background!: Phaser.GameObjects.Image;
  private shade!: Phaser.GameObjects.Graphics;
  private meters!: Phaser.GameObjects.Graphics;
  private ambient!: Phaser.GameObjects.Graphics;
  private figures = new Map<string, Figure>();
  private opponents = new Map<string, Figure>();
  private guest: Figure | null = null;
  private discovery!: Phaser.GameObjects.Image;
  private discoveryLabel!: Phaser.GameObjects.Text;
  private effects = new Set<Phaser.GameObjects.GameObject>();
  private seen = new Map<string, number>();
  private sceneKey = "";
  private cutinKey = "";
  private backgroundKey = "";
  private loading = false;
  failed = false;

  constructor(
    private scene: Phaser.Scene,
    private bridge: AdventureBridge,
    private engine: typeof Phaser,
    private runtime: RuntimeState,
    private syncPause: () => void,
  ) {}
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
    this.discovery = this.scene.add
      .image(0, 0, "/items/chest.png")
      .setDepth(25)
      .setOrigin(0.5, 0.9)
      .setVisible(false);
    this.discoveryLabel = this.scene.add
      .text(0, 0, "", {
        fontFamily: font,
        fontSize: "12px",
        color: "#fff0bd",
        stroke: "#17352a",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(26);
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
  private makeFigure(index: number, name: string): Figure {
    const asset = spriteAsset(index);
    return {
      image: this.scene.add.image(0, 0, asset, spriteFrame(index)).setOrigin(0.5, 0.9),
      shadow: this.scene.add.ellipse(0, 0, 60, 12, 0x092821, 0.28).setDepth(4),
      label: this.scene.add
        .text(0, 0, name, {
          fontFamily: font,
          fontSize: "12px",
          color: "#fff1cf",
          stroke: "#132e27",
          strokeThickness: 4,
        })
        .setOrigin(0.5, 0)
        .setDepth(31),
    };
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
  private removeFigure(figure: Figure) {
    figure.image.destroy();
    figure.shadow.destroy();
    figure.label.destroy();
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
    for (const effect of this.effects) {
      this.scene.tweens.killTweensOf(effect);
      effect.destroy();
    }
    this.effects.clear();
    this.seen.clear();
  }
  stopMotion() {
    this.clearEffects();
    this.scene.cameras.main.resetFX();
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
          fontFamily: font,
          fontSize: event.kind === "burst" ? "30px" : "23px",
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
    const size = event.kind === "burst" ? 38 : event.kind === "skill" ? 27 : 17;
    const ring = this.scene.add.circle(x, y, size).setStrokeStyle(2, color, 0.95).setDepth(48);
    this.transient(ring, { scale: 2.2, alpha: 0 }, 550 - age);
    if (this.rangedEffect(frame, actor, support, x, y, color, age)) return;
    this.slashEffect(event, frame, support, x, y, age);
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
  private moteEffects(support: boolean, x: number, y: number, color: number, age: number) {
    if (this.runtime.reduced || age > 650) return;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5,
        mote = this.scene.add.circle(x, y, 2 + (i % 2), color).setDepth(47);
      this.transient(
        mote,
        { x: x + Math.cos(angle) * 45, y: y + Math.sin(angle) * 35 - (support ? 20 : 0), alpha: 0 },
        650 - age,
      );
    }
  }
  private eventEffect(event: GameEvent, frame: AdventureFrame, now: number) {
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      age = now - event.at;
    const actor = frame.members.find((m) => m.id === event.hero) || frame.members[0];
    const support =
      event.kind === "heal" || event.kind === "hurt" || (event.kind === "skill" && !event.amount);
    const dest =
      frame.members.find((m) => m.id === event.target) ||
      (support ? actor : frame.targets.find((target) => target.id === event.enemy) || frame.target);
    if (!dest) return;
    const x = dest.x * width,
      y = dest.y * height - spriteSize(width, height) * 0.45,
      color = eventColor(event);
    this.amountEffect(event, frame, x, y, color, age);
    this.strikeEffect(event, frame, actor, support, x, y, color, age);
    this.moteEffects(support, x, y, color, age);
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
      figure = this.makeFigure(member.sprite, member.name);
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
      .setText(member.exploring ? "寄り道中" : member.name);
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
        this.removeFigure(figure);
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
        this.removeFigure(figure);
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
      opponent = this.makeFigure(target.sprite, target.name);
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
        (e) => ["hit", "assist", "burst", "skill", "combo"].includes(e.kind) && now - e.at < 140,
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
  private paintGuest(
    input: ReturnType<AdventureBridge["read"]>,
    frame: AdventureFrame,
    size: number,
  ) {
    const guest =
      frame.quest.companion && input.squad.run
        ? heroes.find((h) => h.id === frame.quest.companion)
        : null;
    if (!guest) {
      if (this.guest) {
        this.removeFigure(this.guest);
        this.guest = null;
      }
      return;
    }
    if (!this.guest) this.guest = this.makeFigure(guest.sprite, guest.name);
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      asset = spriteAsset(guest.sprite);
    this.guest.image
      .setTexture(asset, spriteFrame(guest.sprite))
      .setPosition(width * 0.12, height * 0.82)
      .setDisplaySize(size * 0.65, size * 0.65)
      .setDepth(19);
    this.guest.shadow
      .setPosition(width * 0.12, height * 0.82)
      .setDisplaySize(size * 0.4, size * 0.07);
    this.guest.label
      .setText(guest.name + " · 同行中")
      .setPosition(width * 0.12, height * 0.82 + size * 0.1);
  }
  private paintDiscovery(frame: AdventureFrame, now: number) {
    const discovery = frame.discovery;
    this.discovery.setVisible(!!discovery);
    this.discoveryLabel.setVisible(!!discovery);
    if (!discovery) return;
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      float = this.runtime.reduced ? 0 : Math.sin(now / 380) * 3;
    this.discovery
      .setTexture(`/items/${discovery.kind}.png`)
      .setPosition(discovery.x * width, discovery.y * height + float)
      .setDisplaySize(64, 64)
      .setAlpha(discovery.claimed ? 0.55 : 1);
    const label = discovery.claimed
      ? "見つけた！"
      : discovery.kind === "chest"
        ? "隠し宝箱"
        : discovery.kind === "herb"
          ? "光る薬草"
          : "迷子の精霊";
    this.discoveryLabel.setText(label).setPosition(discovery.x * width, discovery.y * height + 10);
  }
  private paintEvents(frame: AdventureFrame, now: number) {
    for (const [id, at] of this.seen) if (now - at > 2000) this.seen.delete(id);
    for (const event of frame.events) {
      if (this.seen.has(event.id)) continue;
      this.seen.set(event.id, event.at);
      if (
        ["hit", "skill", "heal", "hurt", "burst", "combo", "assist", "gather"].includes(event.kind)
      )
        this.eventEffect(event, frame, now);
    }
  }
  private paintCutin(input: ReturnType<AdventureBridge["read"]>, frame: AdventureFrame) {
    if (!frame.cutin) return;
    const key = input.squad.id + ":" + frame.cutin.kind + ":" + String(frame.cutin.at);
    if (key === this.cutinKey) return;
    this.cutinKey = key;
    if (this.runtime.reduced) return;
    if (frame.cutin.kind === "burst") this.scene.cameras.main.shake(160, 0.003);
    const width = this.scene.scale.width,
      height = this.scene.scale.height,
      wave = this.scene.add
        .circle(width * 0.65, height * 0.55, 30)
        .setStrokeStyle(4, 0xffe3a0, 0.9)
        .setDepth(45);
    this.transient(wave, { scale: Math.max(width, height) / 40, alpha: 0 }, 700);
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
    this.paintGuest(input, frame, size);
    this.paintDiscovery(frame, now);
    this.paintEvents(frame, now);
    this.paintCutin(input, frame);
  }
}
