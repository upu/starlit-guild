import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { nightBridgeLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { roadX, roadY } from "./road-layout.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import { RoadGait } from "./road-gait.ts";

export const nightBridgeAssets = {
  bank: "/storybook-study/transplant-night-path-v1.png",
  bankPortrait: "/storybook-study/night-road-portrait-v1.png",
  approach: "/storybook-study/bridge-approach-night-v1.png",
  approachPortrait: "/storybook-study/bridge-approach-portrait-v1.png",
  bridge: "/storybook-study/bridge-night-v1.png",
  bridgePortrait: "/storybook-study/bridge-arrival-portrait-v1.png",
  cart: "/storybook-study/garden-handcart-v2.webp",
  stone: "/storybook-study/covered-stone-v1.webp",
  pot: "/storybook-study/empty-garden-pot-v1.webp",
  push: "/storybook-study/finn-night-push-balanced-v5.webp",
  walk: "/storybook-study/finn-night-walk-balanced-v2.webp",
  battle: "/storybook-study/finn-night-battle-balanced-v2.webp",
  injury: "/storybook-study/finn-injury-balanced-v2.webp",
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = { x: number; y: number };
// Position Finn so his reaching hands meet the crossbar, not its right tip.
const grip = { x: 149, y: 23 };

/** Change only the drawn coordinates; combat events and save state stay intact. */
export function presentNightBridge(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "keystone-night-road" ||
    input.backgroundOverride !== nightBridgeAssets.bank
  )
    return;
  look.nightBridge = {
    node: input.squad.run?.node ?? 14,
    completed: !!input.questComplete && !input.squad.run,
    instant: !!input.skipVisual,
    wheel: !!input.nightWheel,
  };
  Object.assign(look, {
    background: nightBridgeAssets.bank,
    backgroundShade: 0,
    night: true,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  const l = nightBridgeLayout(view, look.nightBridge.completed ? 2 : 0),
    heroes = battle.heroes,
    enemies = battle.enemies;
  battle.distance = 0;
  battle.heroes = heroes.map((hero, i) => ({
    ...hero,
    ...l.world(550 + i * 160, 750),
    walking: false,
  }));
  battle.enemies = enemies.map((enemy, i) => ({
    ...enemy,
    ...l.world(510 + i * 50, 500 + i * 100),
  }));
  battle.effects = battle.effects.map((effect) => {
    const target = enemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    const patient = heroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    const source = heroes.findIndex((h) => h.x === effect.fromX && h.lane === effect.fromLane);
    return {
      ...effect,
      ...(target >= 0 ? { x: battle.enemies[target].x, lane: battle.enemies[target].lane } : {}),
      ...(patient >= 0 ? { x: battle.heroes[patient].x, lane: battle.heroes[patient].lane } : {}),
      ...(source >= 0
        ? { fromX: battle.heroes[source].x, fromLane: battle.heroes[source].lane }
        : {}),
    };
  });
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(700, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: nightBridgeAssets.cart,
    });
  }
}

function followNightHeroes(before: RoadBattle, after: RoadBattle) {
  return before.effects.map((effect) => {
    const source = before.heroes.findIndex(
      (h) => h.x === effect.fromX && h.lane === effect.fromLane,
    );
    const patient = before.heroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    return {
      ...effect,
      ...(source >= 0
        ? { fromX: after.heroes[source].x, fromLane: after.heroes[source].lane }
        : {}),
      ...(patient >= 0 ? { x: after.heroes[patient].x, lane: after.heroes[patient].lane } : {}),
    };
  });
}

export class RoadNightBridge {
  private key = "";
  private cart: Point = { x: 1000, y: 710 };
  private section = 0;
  private transitionAt?: number;
  private pushNode = -1;
  private pushing = false;
  private destination: Point = this.cart;
  private pushOrigin: Point = this.cart;
  private pushAt = 0;
  private time = 0;
  private gait = new RoadGait();
  private walkingGait = new RoadGait();
  private reduced = false;

  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const site = frame.look.nightBridge;
    if (!site) return frame;
    this.reduced = reduced;
    this.time = frame.battle.time;
    if (this.key !== key) this.reset(key, site);
    const desired = site.completed ? 2 : site.node >= 6 ? 1 : 0;
    const fade = this.transition(desired, frame.battle.time, !!site.instant);
    const fighting = frame.battle.enemies.some((e) => e.hp > 0);
    const transport = site.node % 3 === 1 && !fighting && frame.battle.phase === "journey";
    this.updateTransport(transport, site.node);
    const l = nightBridgeLayout(view, this.section);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
      heroes: frame.battle.heroes.map((h) => ({
        ...h,
        ...l.world(...this.target(h.id, fighting, transport, !!site.wheel, view)),
        walking: false,
        facing: -1,
      })),
    };
    battle.effects = followNightHeroes(frame.battle, battle);
    const backgrounds = [
      nightBridgeAssets.bank,
      nightBridgeAssets.approach,
      nightBridgeAssets.bridge,
    ];
    const look = {
      ...frame.look,
      background: backgrounds[this.section],
      workers: [] as string[],
      nightBridge: { ...site, section: this.section, fade },
    };
    return { battle, look };
  }
  private reset(key: string, site: NonNullable<RoadLook["nightBridge"]>) {
    this.key = key;
    this.section = site.completed ? 2 : site.node >= 6 ? 1 : 0;
    this.cart = { x: 1000, y: 710 };
    this.pushNode = -1;
    this.pushing = false;
    this.transitionAt = undefined;
    this.gait = new RoadGait();
    this.walkingGait = new RoadGait();
  }
  private updateTransport(transport: boolean, node: number) {
    if (!transport) {
      this.pushing = false;
    } else if (this.pushNode !== node) {
      this.pushNode = node;
      this.pushing = false;
      this.pushOrigin = { ...this.cart };
      const stop = node < 6 ? 1 + Math.floor(node / 3) : 1 + Math.floor((node - 7) / 3);
      this.destination = { x: 1000 - 50 * stop, y: this.cart.y - 10 };
    }
  }
  private transition(desired: number, time: number, instant: boolean) {
    if (desired === this.section && this.transitionAt === undefined) return 0;
    this.transitionAt ??= time;
    if (this.reduced || instant) {
      this.enterSection(desired);
      this.transitionAt = undefined;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    if (elapsed >= 400 && this.section !== desired) {
      this.enterSection(desired);
      // A delayed paint may skip the midpoint; always hide the new placement
      // under one fully black frame before revealing it.
      this.transitionAt = time - 400;
      return 1;
    }
    if (elapsed >= 800) {
      this.transitionAt = undefined;
      return 0;
    }
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private enterSection(desired: number) {
    if (desired === this.section) return;
    this.section = desired;
    if (desired === 1) {
      // The new stretch is revealed only after the screen has faded to black.
      this.cart = { x: 1000, y: 710 };
      this.pushNode = -1;
      this.pushing = false;
    }
  }
  private target(
    id: Traveller["id"],
    fighting: boolean,
    transport: boolean,
    wheel = false,
    view?: RoadViewport,
  ): [number, number] {
    if (this.section === 2) {
      const points: Partial<Record<Traveller["id"], [number, number]>> = {
        aria: [514, 469],
        leon: [140, 720],
        mira: [1100, 587],
        finn: [856, 522],
      };
      return points[id] ?? [1200, 850];
    }
    const p = transport && this.pushing ? this.pushTarget() : this.cart;
    // A 3:2 map already has five dialogue rows below the cast. Move Mira
    // behind the cart before that ratio, keeping the portrait formation intact.
    const wide = view ? Math.max(0, Math.min(1, (view.width / view.height - 1) / 0.5)) : 0;
    const spots: Partial<Record<Traveller["id"], [number, number]>> = {
      aria: [Math.max(620, this.cart.x - 300), this.cart.y - 175],
      leon:
        wheel && this.section === 1 && !fighting
          ? [this.cart.x - 140, this.cart.y + 8]
          : [Math.max(660, this.cart.x - 260), this.cart.y - 15],
      mira: [this.cart.x + 20 - 50 * wide, this.cart.y + 160 - 350 * wide],
      finn: fighting ? [this.cart.x + 190, this.cart.y - 115] : [p.x + grip.x, p.y + grip.y],
    };
    return spots[id] ?? [1200, 850];
  }
  private pushTarget() {
    const progress = this.reduced ? 1 : Math.min(1, Math.max(0, (this.time - this.pushAt) / 1800));
    return {
      x: this.pushOrigin.x + (this.destination.x - this.pushOrigin.x) * progress,
      y: this.pushOrigin.y + (this.destination.y - this.pushOrigin.y) * progress,
    };
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions,
      site = look.nightBridge;
    if (!scene || !site) return;
    if (this.section === 2) {
      bridgeCart(scene, view, { x: 680, y: 623 }, true);
      this.returnPose(scene);
      return;
    }
    const finn = battle.heroes.find((h) => h.id === "finn");
    const fighting = battle.enemies.some((e) => e.hp > 0);
    if (finn && finn.hp > 0) this.finnPose(battle, scene, finn, view, fighting, site.node);
    bridgeCart(scene, view, this.cart, false);
  }
  private returnPose(scene: NonNullable<RoadBattle["waterwayActions"]>) {
    scene.poses.finn = { asset: nightBridgeAssets.injury, frame: 5, rows: 2 };
  }
  private finnPose(
    battle: RoadBattle,
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    finn: Traveller,
    view: RoadViewport,
    fighting: boolean,
    node: number,
  ) {
    if (fighting) {
      const striking = battle.effects.some(
        (effect) => effect.hero === "finn" && effect.kind === "slash",
      );
      if (!finn.walking || striking) this.battlePose(battle, scene);
      else this.walkPose(battle, scene, finn, view);
      return;
    }
    const active = node % 3 === 1 && battle.phase === "journey";
    this.pushPose(battle, scene, finn, view, active);
  }
  private pushPose(
    battle: RoadBattle,
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    finn: Traveller,
    view: RoadViewport,
    active: boolean,
  ) {
    const l = nightBridgeLayout(view, this.section);
    const at =
      !finn.walking && waterwayAt(finn, l.world(...this.target("finn", false, active)), view);
    if (active && at && !this.pushing) {
      this.pushing = true;
      this.pushAt = battle.time;
      this.pushOrigin = { ...this.cart };
    }
    const moved = active && this.pushing && this.followFinn(finn, view);
    // Consecutive paints can share a coordinate between simulation updates.
    // Keep the stride while the cart is travelling instead of flashing idle.
    const travelling =
      Math.hypot(this.destination.x - this.pushOrigin.x, this.destination.y - this.pushOrigin.y) >
      1;
    if (
      !this.reduced &&
      (moved || (active && this.pushing && travelling && battle.time - this.pushAt < 1800))
    )
      finn.walking = true;
    this.setPushPose(battle, scene, finn, view, active && (this.pushing || at));
  }
  private setPushPose(
    battle: RoadBattle,
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    finn: Traveller,
    view: RoadViewport,
    attached: boolean,
  ) {
    const stride = this.gait.frame(finn, {
      ...view,
      stage: battle.stage,
      figureSize: nightBridgeLayout(view, this.section).figureSize,
    });
    if (attached) {
      finn.facing = -1;
      scene.poses.finn = {
        asset: nightBridgeAssets.push,
        frame: finn.walking && !this.reduced ? 2 + stride : 1,
        rows: 2,
      };
    } else if (finn.walking && !this.reduced) {
      scene.poses.finn = { asset: nightBridgeAssets.walk, frame: stride, rows: 1 };
    } else if (!finn.walking || this.reduced)
      scene.poses.finn = { asset: nightBridgeAssets.injury, frame: 5, rows: 2 };
  }
  private walkPose(
    battle: RoadBattle,
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    finn: Traveller,
    view: RoadViewport,
  ) {
    if (this.reduced) {
      this.battlePose(battle, scene);
      return;
    }
    const frame = this.walkingGait.frame(finn, {
      ...view,
      stage: battle.stage,
      figureSize: nightBridgeLayout(view, this.section).figureSize,
    });
    scene.poses.finn = { asset: nightBridgeAssets.walk, frame, rows: 1 };
  }
  private followFinn(finn: Traveller, view: RoadViewport) {
    const l = nightBridgeLayout(view, this.section);
    const next = {
      x: (roadX(finn.x, 0, view.width) - l.backdrop.x) / l.scale - grip.x,
      y: (roadY(finn.lane, view.height, view.width) - l.backdrop.y) / l.scale - grip.y,
    };
    const moved = Math.hypot(next.x - this.cart.x, next.y - this.cart.y) > 0.02;
    this.cart = next;
    return moved;
  }
  private battlePose(battle: RoadBattle, scene: NonNullable<RoadBattle["waterwayActions"]>) {
    const strike = battle.effects.findLast((e) => e.hero === "finn" && e.kind === "slash");
    const age = strike ? battle.time - strike.at : -1;
    const frame = !this.reduced && age >= 0 && age < 600 ? Math.min(3, Math.floor(age / 150)) : 0;
    scene.poses.finn = { asset: nightBridgeAssets.battle, frame, cell: 256 };
  }
}

function bridgeCart(
  scene: NonNullable<RoadBattle["waterwayActions"]>,
  view: RoadViewport,
  p: Point,
  flipped: boolean,
) {
  const l = nightBridgeLayout(view, flipped ? 2 : 0);
  const cart = housecallProp(
    view,
    "night-cart",
    nightBridgeAssets.cart,
    l.world(p.x, p.y),
    288,
    l.scale,
  );
  cart.flipX = flipped;
  scene.props.push(cart);
  for (const [id, asset, dx, dy, width] of [
    ["night-stone", nightBridgeAssets.stone, flipped ? 99 : -33, -118, 69],
    ["night-pot", nightBridgeAssets.pot, flipped ? 22 : 22, -81, 66],
  ] as const) {
    const prop = housecallProp(view, id, asset, l.world(p.x + dx, p.y + dy), width, l.scale);
    prop.depth = cart.depth + 0.01;
    scene.props.push(prop);
  }
}
