import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";
import { brekkaLedgerLayout } from "./road-brekka-ledger-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { BrekkaArrivalTransition } from "./road-brekka-arrival-transition.ts";
import { roadDepth, roadScale } from "./road-layout.ts";

export const mossTrailAssets = {
  bank: "/storybook-study/brekka-alley-v1.png",
  portrait: "/storybook-study/brekka-trail-portrait-v1.png",
  fork: "/storybook-study/brekka-fork-v1.png",
  forkPortrait: "/storybook-study/brekka-fork-portrait-v1.png",
  cart: "/storybook-study/brekka-basket-cart-v1.webp",
  wheel: "/storybook-study/brekka-cart-wheel-v1.webp",
  driver: "/storybook-study/brekka-cart-driver-v1.webp",
  notes: "/storybook-study/leon-route-notes-v1.webp",
  moss: "/storybook-study/wheel-moss-scrap-v1.webp",
};
type Frame = { battle: RoadBattle; look: RoadLook };

/** Keep the cloth at the portrait fork's left edge within the visible crop. */
export function mossTrailBackdrop<T extends { x: number }>(
  backdrop: T,
  view: RoadViewport,
  trail?: { fork?: boolean; portrait?: boolean },
): T {
  return trail?.fork && (trail.portrait ?? view.height > view.width)
    ? { ...backdrop, x: 0 }
    : backdrop;
}

/** Draw a distant cart to follow; no quest state or party membership is changed. */
export function presentMossTrail(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const run = input.squad.run;
  if (
    !run ||
    !["glowing-moss-trail", "glowing-moss-trail-next-day"].includes(run.quest) ||
    !frame.look.storybookHeroes ||
    input.backgroundOverride !== mossTrailAssets.bank
  )
    return;
  const fraction =
    run.phase === "work" && run.targetMax > 0
      ? Math.max(0, Math.min(1, 1 - run.target / run.targetMax))
      : 0;
  frame.look.mossTrail = {
    node: run.node,
    progress: Math.max(0, Math.min(1, (run.node + fraction) / run.nodes)),
    paused: input.paused || run.phase === "rest",
    idle: false,
    writing:
      !!input.mossTrailNote &&
      frame.battle.heroes.some((hero) => hero.id === "leon" && hero.hp > 0 && !hero.paralyzed),
    secondDay: run.quest === "glowing-moss-trail-next-day",
    completed: !!input.questComplete,
  };
  Object.assign(frame.look, {
    background: mossTrailAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  const layout = brekkaLedgerLayout(view);
  const previous = frame.battle.heroes;
  frame.battle.distance = 0;
  frame.battle.stage = "forest";
  frame.battle.gathering = null;
  frame.battle.heroes = previous.map((hero) => ({
    ...hero,
    ...layout.world(hero.id === "aria" ? 350 : 480, hero.id === "aria" ? 805 : 830),
    walking: false,
    facing: 1,
  }));
  frame.battle.enemies = frame.battle.enemies.map((enemy, i) => ({
    ...enemy,
    ...layout.world(
      650 + i * 100,
      710 + i * 35 - trailVerticalShift(view, frame.look.mossTrail?.secondDay),
    ),
  }));
}

/** Screen-space movement is bounded independently from the game's clock. */
export class RoadMossTrail {
  private key = "";
  private x = 0;
  private partyX = 0;
  private last?: number;
  private distance = 0;
  private fork = new BrekkaArrivalTransition();
  private ending = new MossTrailEnding();
  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const trail = frame.look.mossTrail;
    if (!trail) return frame;
    const desired = trail.completed ? 1100 : 740 + trail.progress * 360;
    this.reset(key, desired, frame.battle.time);
    const delta = Math.max(
      0,
      Math.min(0.05, (frame.battle.time - (this.last ?? frame.battle.time)) / 1000),
    );
    this.last = frame.battle.time;
    const fighting = frame.battle.enemies.some((enemy) => enemy.hp > 0);
    const transition = this.fork.update({
      ready: this.x >= 860,
      paused: trail.paused || fighting,
      instant: reduced,
      time: frame.battle.time,
    });
    const step =
      trail.paused || fighting || reduced || (this.x >= 860 && !transition.complete)
        ? 0
        : Math.max(0, Math.min((desired - this.x) * (1 - Math.exp(-delta / 0.45)), delta * 100));
    const before = this.x;
    if (reduced) this.x = desired;
    else this.x += step;
    const partyStep = this.moveParty(trail, delta, fighting, reduced);
    const ending = this.endingResult(
      trail,
      transition.complete,
      fighting,
      frame.battle.time,
      reduced,
    );
    const portrait = view.height > view.width;
    this.distance += Math.hypot(
      (trailScreenX(view, this.x) - trailScreenX(view, before)) * (portrait ? 0.85 : 1),
      (trailY(this.x) - trailY(before)) * (portrait ? 1.3 : 1),
    );
    const x = trailScreenX(view, this.x);
    const y = trailY(this.x) - trailVerticalShift(view, trail.secondDay);
    const heroes = frame.battle.heroes.map((hero) => ({
      ...hero,
      ...trailHeroPosition(view, this.partyX, hero.id, trail.secondDay),
      facing: 1 as const,
      walking: partyStep > 0.02,
    }));
    const look = trailLook(frame.look, trail, transition, ending);
    return {
      look,
      battle: {
        ...frame.battle,
        heroes,
        waterwayActions: mossTrailObjects(view, x, y, this.distance, step > 0.02),
      },
    };
  }
  private reset(key: string, desired: number, time: number) {
    if (this.key === key) return;
    this.key = key;
    this.x = desired;
    this.partyX = desired;
    this.last = time;
    this.distance = 0;
    this.fork = new BrekkaArrivalTransition();
    this.ending = new MossTrailEnding();
    if (desired >= 860) this.fork.update({ ready: true, paused: false, instant: true, time });
  }
  private moveParty(
    trail: NonNullable<RoadLook["mossTrail"]>,
    delta: number,
    fighting: boolean,
    reduced: boolean,
  ) {
    if (trail.writing || trail.paused || fighting) return 0;
    const step = reduced ? this.x - this.partyX : Math.min(this.x - this.partyX, delta * 140);
    this.partyX += Math.max(0, step);
    return step;
  }
  private endingResult(
    trail: NonNullable<RoadLook["mossTrail"]>,
    forkComplete: boolean,
    fighting: boolean,
    time: number,
    reduced: boolean,
  ) {
    return this.ending.update({
      ready: !!trail.completed && this.x >= 1099 && forkComplete && !fighting,
      paused: trail.paused,
      instant: reduced,
      time,
    });
  }
  finish(battle: RoadBattle, look: RoadLook) {
    const trail = look.mossTrail;
    const leon = battle.heroes.find((hero) => hero.id === "leon");
    if (
      !trail ||
      !trail.writing ||
      !leon ||
      leon.hp <= 0 ||
      leon.paralyzed ||
      leon.walking ||
      battle.enemies.some((enemy) => enemy.hp > 0) ||
      !battle.waterwayActions
    )
      return;
    battle.waterwayActions.poses.leon = { asset: mossTrailAssets.notes, frame: 2 };
  }
}

function trailLook(
  look: RoadLook,
  trail: NonNullable<RoadLook["mossTrail"]>,
  transition: { arrival: boolean; fade: number },
  ending: { fade: number; complete: boolean },
): RoadLook {
  return {
    ...look,
    background: transition.arrival ? mossTrailAssets.fork : mossTrailAssets.bank,
    mossTrail: {
      ...trail,
      fork: transition.arrival,
      fade: Math.max(transition.fade, ending.fade),
      visualComplete: ending.complete,
    },
  };
}

/** Fade out only after the last visible pursuit step has caught up. */
class MossTrailEnding {
  private elapsed = 0;
  private previous?: number;
  update(input: { ready: boolean; paused: boolean; instant: boolean; time: number }) {
    const delta = Math.max(0, Math.min(100, input.time - (this.previous ?? input.time)));
    this.previous = input.time;
    if (!input.ready) this.elapsed = 0;
    else if (input.instant) this.elapsed = 900;
    else if (!input.paused) this.elapsed = Math.min(900, this.elapsed + delta);
    return { fade: Math.min(1, this.elapsed / 700), complete: this.elapsed >= 900 };
  }
}

function trailY(x: number) {
  return 690 - Math.min(1, Math.max(0, (x - 860) / 240)) * 80;
}

function trailVerticalShift(view: RoadViewport, secondDay?: boolean) {
  return view.height <= view.width ? (secondDay ? 210 : 120) : 0;
}

function trailHeroPosition(view: RoadViewport, x: number, id: string, secondDay?: boolean) {
  const left = id === "aria" || (secondDay && id === "mira");
  const lanes: Record<string, number> = { aria: 75, leon: 85, mira: 200, finn: 210 };
  const y = secondDay ? (lanes[id] ?? 210) : id === "aria" ? 115 : 140;
  return brekkaLedgerLayout(view).world(
    trailScreenX(view, x) - (left ? 390 : 260),
    trailY(x) -
      trailVerticalShift(view, secondDay) +
      y -
      (secondDay && view.height <= view.width ? 65 : 0),
  );
}

/** Keep both ends of the moving formation in frame across the portrait route. */
function trailScreenX(view: RoadViewport, x: number) {
  if (view.height <= view.width) return x;
  const layout = brekkaLedgerLayout(view);
  const leftEdge = layout.figureSize * 0.5 + 5;
  const rightEdge = view.width - layout.figureSize * 0.6 - 5;
  const start = Math.max(740, layout.unproject(leftEdge, 0).x + 390);
  const end = layout.unproject(rightEdge, 0).x - 172;
  const fraction = Math.max(0, Math.min(1, (end - start) / 360));
  return start + (x - 740) * fraction;
}

function mossTrailObjects(
  view: RoadViewport,
  x: number,
  y: number,
  distance: number,
  walking: boolean,
) {
  const layout = brekkaLedgerLayout(view);
  const cart = housecallProp(
    view,
    "trail-basket-cart",
    mossTrailAssets.cart,
    layout.world(x, y),
    240,
    layout.scale,
  );
  cart.origin = { x: 0.5, y: 275 / 384 };
  const wheel = housecallProp(
    view,
    "trail-cart-wheel",
    mossTrailAssets.wheel,
    layout.world(
      x - (view.height > view.width ? 75 : 64),
      y - (view.height > view.width ? 25 : 33),
    ),
    99,
    layout.scale,
  );
  wheel.origin = { x: 0.5, y: 0.5 };
  wheel.depth = cart.depth + 0.02;
  wheel.angle = ((distance / 49.5) * 180) / Math.PI;
  const moss = trailWheelMoss(view, wheel, layout.scale);
  const driver = {
    id: "trail-cart-driver",
    point: layout.world(x + (view.height > view.width ? 172 : 146), y),
    pose: {
      asset: mossTrailAssets.driver,
      frame: walking ? 4 + (Math.floor(distance / 30) % 4) : 5,
      cell: 128,
      rows: 2,
      square: { foot: 120, height: 94 },
    },
    size: layout.figureRatio * 0.8,
    facing: 1 as const,
  };
  return {
    poses: {},
    props: [cart, wheel, moss],
    actors: [driver],
    debrisHidden: true,
    closeContact: false,
  };
}

function trailWheelMoss(
  view: RoadViewport,
  wheel: ReturnType<typeof housecallProp>,
  scale: number,
) {
  const angle = ((wheel.angle ?? 0) * Math.PI) / 180;
  const point = {
    x: wheel.point.x + (Math.cos(angle) * 34 * scale) / roadScale(view.width),
    lane: wheel.point.lane + (Math.sin(angle) * 34 * scale) / roadDepth(view.width, view.height),
  };
  const moss = housecallProp(view, "trail-wheel-moss", mossTrailAssets.moss, point, 15, scale);
  moss.origin = { x: 0.5, y: 0.5 };
  moss.angle = wheel.angle;
  moss.depth = wheel.depth + 0.01;
  return moss;
}
