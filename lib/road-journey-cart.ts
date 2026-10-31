import type { RoadBattle, Traveller } from "./road-view.ts";
import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import { roadCartSlot, type RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadScale, roadX, roadHeroSize } from "./road-layout.ts";
import { BrekkaCartCamera } from "./road-brekka-cart-camera.ts";
import { journeyCameraDistance } from "./road-journey-camera.ts";
import { brekkaArrival } from "./road-brekka-arrival.ts";
import { BrekkaNotes } from "./road-brekka-notes.ts";
import type { FoundingCargo } from "./road-founding-cargo.ts";
import { foundingGrip } from "./road-founding-grip.ts";
import {
  foundingArrived,
  foundingArrivalHero,
  foundingCartAsset,
  foundingTravellingCompanion,
} from "./road-founding-formation.ts";
export { foundingCartAsset } from "./road-founding-formation.ts";
export { journeyCartWorkState } from "./road-journey-work.ts";
export type JourneyCart = {
  asset?: string;
  x: number;
  lane: number;
  phase: "parked" | "retrieving" | "moving";
  returning: boolean;
  cargo?: FoundingCargo;
};
type Frame = { battle: RoadBattle; look: RoadLook };
export const foundingRoadBackground = "/storybook-study/founding-return-path-v1.png";
const foundingCart = (look: RoadLook) =>
  look.quest === "starlit-guild-founding" && look.background === foundingRoadBackground;
export function presentFoundingCartDraft(frame: Frame, input: AdventureInput) {
  if (
    frame.look.quest === "starlit-guild-founding" &&
    input.storybookHeroes &&
    input.backgroundOverride === foundingRoadBackground
  ) {
    frame.look.background = foundingRoadBackground;
    const run = input.squad.run;
    if (run?.quest === "starlit-guild-founding") {
      frame.look.foundingDraft = {
        node: run.node,
        total: run.nodes,
        working: run.phase === "work",
        departureAge: Math.max(0, input.now - run.started),
        completed: !!input.questComplete,
      };
      if (input.questComplete) {
        frame.battle.phase = "arrived";
        frame.battle.enemies = [];
        frame.battle.effects = [];
      }
    }
  }
}
const cartPuller = (cart: JourneyCart) => (cart.asset === foundingCartAsset ? "finn" : "leon");
function cartCarriers(cart: JourneyCart, heroes: Traveller[]) {
  const ids = cart.asset === foundingCartAsset ? ["finn"] : ["aria", "leon"];
  return heroes.filter(
    (hero) =>
      hero.hp > 0 && ids.includes(hero.id) && (cart.asset !== foundingCartAsset || !hero.paralyzed),
  );
}
function cartStopped(
  frame: Frame,
  cart: JourneyCart,
  view: RoadViewport,
  fighting: boolean,
  foraging: boolean,
) {
  return (
    fighting ||
    foraging ||
    !!frame.look.brekkaNotes ||
    (foundingCart(frame.look) &&
      (frame.battle.phase === "rest" ||
        (!!frame.look.foundingDraft?.completed && cart.x >= frame.look.length - 1) ||
        (!!frame.battle.gathering && cart.x >= foundingDestination(frame, cart, view) - 1) ||
        !frame.battle.heroes.some((hero) => hero.id === "finn" && hero.hp > 0 && !hero.paralyzed)))
  );
}
function cartGathering(frame: Frame, cart: JourneyCart, foraging: boolean) {
  let gathering = frame.battle.gathering;
  if (cart.asset === foundingCartAsset && cart.phase !== "parked") return null;
  if (gathering?.task === "carry") gathering = { ...gathering, x: cart.x - 65 };
  if (foraging && gathering) gathering = { ...gathering, lane: 1.08 };
  return gathering;
}
function cartHero(
  hero: Traveller,
  frame: Frame,
  cart: JourneyCart,
  view: RoadViewport,
  carriers: Traveller[],
  foraging: boolean,
  moving: boolean,
) {
  const active = cart.phase !== "parked";
  const arrived = foundingArrived(frame, cart);
  if (arrived) return foundingArrivalHero(hero, cart, view, frame.battle.stage, journeyCartGrip);
  if (active && carriers.includes(hero))
    return {
      ...hero,
      ...journeyCartGrip(hero, cart, view, frame.battle.stage),
      facing: 1 as const,
      walking: cart.phase === "moving" ? moving : hero.walking,
    };
  if (active && cart.asset === foundingCartAsset)
    return foundingTravellingCompanion(hero, cart, view, frame.battle.stage);
  if (active && frame.look.brekkaJourney && hero.id === "mira" && hero.hp > 0)
    return {
      ...hero,
      x:
        cart.x -
        (roadHeroSize(view.width, view.height) * 2) / roadScale(view.width, frame.battle.stage),
      lane:
        cart.lane -
        (roadHeroSize(view.width, view.height) * 0.35) / roadDepth(view.width, view.height),
    };
  return foraging ? { ...hero, lane: hero.lane + 0.4 } : hero;
}
export const journeyCartWidth = (view: RoadViewport, cart?: Pick<JourneyCart, "asset">) =>
  roadHeroSize(view.width, view.height) *
  (cart?.asset
    ? (145 * (cart.asset === foundingCartAsset ? 1.55 : 1)) / 128
    : // The trade scenes use a 44%-wide cart and 24%-wide, 192px figure cells.
      // Match their 144px standing body to the road's 0.9-size body reference.
      (0.9 * 192 * 44) / (144 * 24));
function advanceJourneyCart(
  cart: JourneyCart,
  frame: Frame,
  dt: number,
  reduced: boolean,
  view: RoadViewport,
) {
  if (
    frame.battle.phase === "arrived" &&
    reduced &&
    !(cart.asset === foundingCartAsset && frame.battle.gathering)
  ) {
    cart.x = Math.max(cart.x, frame.look.length);
    cart.phase = "moving";
  }
  if (cart.phase !== "moving") return;
  const target =
    cart.asset === foundingCartAsset
      ? foundingDestination(frame, cart, view)
      : journeyDestination(frame);
  // After gameplay finishes, keep the remaining visible delivery moving at a
  // brisk walk rather than holding the clear screen through a long road gap.
  const speed = cart.asset === foundingCartAsset && frame.look.foundingDraft?.completed ? 150 : 87;
  cart.x += Math.min(Math.max(0, target - cart.x), dt * speed);
}
function foundingDestination(frame: Frame, cart: JourneyCart, view: RoadViewport) {
  if (!frame.battle.gathering) return journeyDestination(frame);
  return (
    frame.battle.gathering.x +
    65 -
    (journeyCartWidth(view, cart) * 1.15) / roadScale(view.width, frame.battle.stage)
  );
}
function journeyDestination(frame: Frame) {
  if (frame.battle.phase === "arrived") return frame.look.length;
  return frame.battle.gathering ? frame.battle.gathering.x + 65 : frame.battle.distance + 65;
}
export function journeyCartObstacles(battle: RoadBattle, view: RoadViewport) {
  const cart = battle.journeyCart;
  if (!cart) return [];
  const size = journeyCartWidth(view, cart),
    scale = roadScale(view.width, battle.stage);
  const parkedMedical = cart.asset?.includes("brekka-medical-cart") && cart.phase === "parked";
  return [
    {
      x:
        (roadX(cart.x - (size * 0.22) / scale, battle.distance, view.width, battle.stage) /
          view.width) *
        560,
      lane: cart.lane,
      clearance: {
        // The trade cart's ground footprint ends behind the rear wheel; leave
        // the pusher's planted feet outside it at the calibrated larger size.
        x: ((size * (parkedMedical ? 0.52 : cart.asset ? 0.4 : 0.3)) / view.width) * 560,
        lane: (size * (parkedMedical ? 0.42 : 0.13)) / roadDepth(view.width, view.height),
      },
    },
  ];
}
function cartBattleSpace(battle: RoadBattle, cart: JourneyCart, view: RoadViewport) {
  const gap =
    (journeyCartWidth(view, cart) * 0.55 + roadHeroSize(view.width, view.height) * 0.5) /
    roadScale(view.width, battle.stage);
  const enemies = battle.enemies.map((e) =>
    Math.abs(e.x - cart.x) < gap && Math.abs(e.lane - cart.lane) < 0.42
      ? { ...e, x: cart.x + (e.x < cart.x ? -gap : gap) }
      : e,
  );
  const effects = battle.effects.map((effect) => {
    const index = battle.enemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    return index < 0 ? effect : { ...effect, x: enemies[index].x };
  });
  return { enemies, effects };
}
export const journeyCartQuest = (look: RoadLook) =>
  !!look.storybookHeroes &&
  (["village-trade", "evening-trade-road"].includes(look.quest ?? "") ||
    !!look.brekkaJourney ||
    foundingCart(look));
export const journeyCartNeedsFinish = (look: RoadLook) =>
  journeyCartQuest(look) && !look.brekkaLedger && !look.brekkaJourney?.arrival;
export function journeyCartGrip(
  hero: Traveller,
  cart: JourneyCart,
  view: RoadViewport,
  stage: string,
) {
  if (cart.asset === foundingCartAsset && hero.id === "finn") {
    const cartSize = journeyCartWidth(view, cart);
    const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
    return {
      x:
        cart.x +
        (cartSize * foundingGrip.cartX + (96 - foundingGrip.handX) * figure) /
          roadScale(view.width, stage),
      lane:
        cart.lane +
        (cartSize * foundingGrip.cartY + (176 - foundingGrip.handY) * figure) /
          roadDepth(view.width, view.height),
    };
  }
  const slot = roadCartSlot(
    view,
    stage,
    false,
    hero.id === "leon",
    true,
    hero.id,
    journeyCartWidth(view, cart),
  );
  return {
    x: cart.x + slot.offset,
    lane:
      slot.lane +
      cart.lane -
      0.82 +
      (journeyCartWidth(view, cart) * 12) / 420 / roadDepth(view.width, view.height),
  };
}
/** Persistent renderer-owned cart. Task changes never create a new cart. */
export class RoadJourneyCartMotion {
  private cart?: JourneyCart;
  private key = "";
  private at = 0;
  private brekkaCamera = new BrekkaCartCamera();
  private notes = new BrekkaNotes();
  /** Move only the renderer-owned cart while the arrival fade is black. */
  arriveFounding(end: number, view: RoadViewport, stage: string) {
    if (this.cart?.asset !== foundingCartAsset || this.cart.x >= end - 1) return undefined;
    this.cart.x = end;
    this.cart.phase = "parked";
    return this.brekkaCamera.arrive(end, view, stage);
  }
  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    if (!journeyCartQuest(frame.look)) {
      this.cart = undefined;
      this.key = "";
      this.brekkaCamera.reset();
      return frame;
    }
    if (frame.look.brekkaJourney?.arrival) {
      this.cart = undefined;
      this.key = "";
      this.brekkaCamera.reset();
      return brekkaArrival(frame, view);
    }
    // The brewery is a separate visual interlude; keep the cart where it was
    // outside rather than drawing it on top of the records desk.
    if (frame.look.brekkaLedger) {
      this.brekkaCamera.reset();
      return frame;
    }
    const source = frame.battle,
      identity = key + ":" + (frame.look.quest ?? "");
    if (identity !== this.key) this.startOrResume(frame, identity, view);
    const cart = this.cart;
    if (!cart) return frame;
    const dt = Math.max(0, Math.min(0.05, (source.time - this.at) / 1000));
    this.at = source.time;
    const fighting = source.enemies.some((e) => e.hp > 0),
      foraging = source.gathering?.task === "gather";
    if (cartStopped(frame, cart, view, fighting, foraging)) cart.phase = "parked";
    else if (cart.phase === "parked") cart.phase = "retrieving";
    const before = cart.x;
    advanceJourneyCart(cart, frame, dt, reduced, view);
    return this.notes.prepare(
      this.place(frame, view, cart, fighting, foraging, cart.x > before),
      view,
      key,
    );
  }
  finish(battle: RoadBattle, view: RoadViewport) {
    if (!this.cart) return;
    if (this.cart.phase === "retrieving") {
      const carriers = cartCarriers(this.cart, battle.heroes);
      if (carriers.length && carriers.every((h) => this.atGrip(h, battle, view, this.cart)))
        this.cart.phase = "moving";
    }
    return { ...this.cart };
  }
  private startOrResume(frame: Frame, identity: string, view: RoadViewport) {
    if (frame.battle.phase === "arrived" && !frame.look.foundingDraft?.completed) {
      this.cart = undefined;
      this.key = "";
      return;
    }
    this.initialize(frame, identity, view);
    if (frame.battle.phase === "arrived" && this.cart?.asset === foundingCartAsset) {
      this.cart.x = frame.look.length;
      this.brekkaCamera.arrive(this.cart.x, view, frame.battle.stage);
    }
  }
  private initialize(frame: Frame, identity: string, view: RoadViewport) {
    const source = frame.battle;
    this.key = identity;
    this.at = source.time;
    this.brekkaCamera.reset();
    const asset = frame.look.brekkaJourney
      ? "/storybook-study/brekka-medical-cart-v1.webp"
      : foundingCart(frame.look)
        ? foundingCartAsset
        : undefined;
    const point = source.gathering ? source.gathering.x + 65 : source.distance;
    this.cart = {
      ...(asset ? { asset } : {}),
      x:
        asset === foundingCartAsset && source.gathering
          ? point - (journeyCartWidth(view, { asset }) * 1.15) / roadScale(view.width, source.stage)
          : point,
      lane: 0.82,
      phase: "parked",
      returning: frame.look.quest === "evening-trade-road",
    };
  }
  private atGrip(
    hero: Traveller,
    battle: RoadBattle,
    view: RoadViewport,
    cart: JourneyCart | undefined,
  ) {
    if (!cart) return false;
    const foot = journeyCartGrip(hero, cart, view, battle.stage);
    return (
      Math.abs(hero.x - foot.x) * roadScale(view.width, battle.stage) < 2 &&
      (cart.asset === foundingCartAsset
        ? Math.abs(hero.lane - foot.lane) * roadDepth(view.width, view.height) < 2
        : Math.abs(hero.lane - foot.lane) < 0.02)
    );
  }
  private place(
    frame: Frame,
    view: RoadViewport,
    cart: JourneyCart,
    fighting: boolean,
    foraging: boolean,
    moving: boolean,
  ): Frame {
    const active = cart.phase !== "parked";
    const arrived = foundingArrived(frame, cart);
    const carriers = cartCarriers(cart, frame.battle.heroes);
    const heroes = frame.battle.heroes.map((h) =>
      cartHero(h, frame, cart, view, carriers, foraging, moving),
    );
    const gathering = cartGathering(frame, cart, foraging);
    const combat = cartBattleSpace(frame.battle, cart, view);
    const positions = fighting
      ? [...heroes.filter((h) => h.hp > 0), ...combat.enemies.filter((e) => e.hp > 0)].map(
          (p) => p.x,
        )
      : [];
    return {
      battle: {
        ...frame.battle,
        ...combat,
        heroes,
        gathering,
        journeyCart: { ...cart },
        distance: journeyCameraDistance(this.brekkaCamera, frame, view, cart, active, positions),
      },
      look: {
        ...frame.look,
        workers: arrived
          ? []
          : active
            ? carriers.map((h) => h.id)
            : fighting
              ? []
              : frame.look.workers,
        frontCarriers: active ? [cartPuller(cart)] : [],
        puller: active ? cartPuller(cart) : null,
      },
    };
  }
}
