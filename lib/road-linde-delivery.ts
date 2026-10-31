import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { waterwayAt, type WaterwayActions } from "./road-waterway-contacts.ts";
import { roadDepth } from "./road-layout.ts";
import { chapterFourWork } from "./chapter-four.ts";
import { RoadGait } from "./road-gait.ts";
import { LindeViewportTransition } from "./road-linde-viewport.ts";
import { lindeCourier, lindeCourierPose, lindeCouriers } from "./road-linde-couriers.ts";
import { lindeHandoffSide } from "./road-linde-handoff-side.ts";
import { LindePaperPickup } from "./road-linde-pickup.ts";
import { lindeLetterPoint } from "./road-linde-letter.ts";

// Delivery art is selected by default for the Linde requests quest.
export const lindeDeliveryAssets = {
  bank: "/storybook-study/linde-delivery-square-v1.png",
  portrait: "/storybook-study/linde-delivery-portrait-v1.png",
  merchant: "/storybook-study/merchant-service-v1.webp",
  parent: "/storybook-study/household-parent-v1.webp",
  offer: "/storybook-study/leon-conversation-v1.webp",
  walk: "/storybook-study/leon-paper-walk-v2.webp",
  paper: "/storybook-study/sealed-request-v1.webp",
};
type Frame = { battle: RoadBattle; look: RoadLook };
const recipients = [
  { x: 600, y: 465 },
  { x: 1100, y: 425 },
];

export function lindeDeliveryObstacles(view: RoadViewport, portrait?: boolean) {
  const l = lindeDeliveryLayout(view, portrait);
  return recipients.map((point) => ({
    x: (l.project(point.x, point.y).x / view.width) * 560,
    // The resident's body extends above their feet. Reserve that space too,
    // otherwise Leon can walk behind and disappear through their torso.
    lane: l.world(point.x, point.y - 35).lane,
    clearance: {
      x: ((45 * l.scale) / view.width) * 560,
      lane: (85 * l.scale) / roadDepth(view.width, view.height),
    },
  }));
}

export function lindeLaneBounds(look: RoadLook, view: RoadViewport) {
  if (!look.lindeDelivery) return {};
  const l = lindeDeliveryLayout(view, look.lindeDelivery.portrait);
  return { minLane: l.world(768, 150).lane, maxLane: l.world(768, 920).lane };
}

/** The visual queue does not alter quest progress or saved positions. */
export class RoadLindeDelivery {
  private key = "";
  private node = 0;
  private startAt = 0;
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private returning = false;
  private returned = false;
  private courier?: Traveller["id"];
  private side: -1 | 1 = -1;
  private sideRecipient?: number;
  private residentHold = false;
  private replacementDeadline?: number;
  private replacementPending = false;
  private gait = new RoadGait();
  private viewport = new LindeViewportTransition();
  private pickup = new LindePaperPickup();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const site = frame.look.lindeDelivery;
    if (!site) return frame;
    if (this.key !== key) this.reset(site, key, frame.battle.time);
    if (!this.pickup.active) this.advance(site, frame.battle.time);
    this.updateCourier(site, frame.battle);
    const display = this.viewport.update(view, frame.battle.time, reduced || !!site.paused);
    const l = lindeDeliveryLayout(view, display.portrait);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    const fighting = battle.enemies.some((enemy) => enemy.hp > 0);
    const opening = battle.time - this.startAt < 600;
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...l.world(...this.target(hero.id, fighting || opening, view, display.portrait)),
      walking: false,
      facing: 1,
    }));
    const look: RoadLook = {
      ...frame.look,
      lindeDelivery: {
        ...site,
        ...display,
        node: this.node,
        visualComplete: this.returned,
        pickupCourier: this.pickup.active ? this.courier : undefined,
      },
      workers: [],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterFourWork("linde-requests", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }

  private reset(site: NonNullable<RoadLook["lindeDelivery"]>, key: string, time: number) {
    this.key = key;
    this.node = site.node;
    this.startAt = time;
    this.at = undefined;
    this.doneAt = undefined;
    this.coldDone = site.completed;
    this.returning = site.completed;
    this.returned = site.completed;
    this.courier = undefined;
    this.side = -1;
    this.sideRecipient = undefined;
    this.residentHold = false;
    this.replacementDeadline = undefined;
    this.replacementPending = false;
    this.gait = new RoadGait();
    this.viewport = new LindeViewportTransition();
    this.pickup = new LindePaperPickup();
  }

  private updateCourier(site: NonNullable<RoadLook["lindeDelivery"]>, battle: RoadBattle) {
    const courier = lindeCourier(battle.heroes, this.courier);
    if (courier !== this.courier) {
      this.prepareResidentLetter(battle.time);
      this.pickup.replace(this.courier, courier, battle.time);
      this.replacementPending = !!courier && !!this.courier;
      this.courier = courier;
      this.at = undefined;
      this.doneAt = undefined;
      this.replacementDeadline = undefined;
      // A replacement must collect the reply before returning to the group.
      if (courier && !site.instant && !this.coldDone) this.returning = false;
    }
    if (!courier) {
      // Never wait for an absent or incapacitated character to reach a handoff.
      // If they recover, the visual sequence resumes at the current work item.
      this.node = site.node;
      this.at = undefined;
      this.doneAt = undefined;
      if (site.completed) this.returned = true;
    }
    this.updateReplacementDeadline(site.completed, battle.time);
  }

  private prepareResidentLetter(time: number) {
    const residentHasLetter = this.pickup.residentHas(this.courier);
    if (residentHasLetter) this.pickup.residentTurns(time);
    this.residentHold = this.node % 3 === 0 && residentHasLetter;
  }

  private updateReplacementDeadline(completed: boolean, time: number) {
    if (completed && this.replacementPending && this.replacementDeadline === undefined)
      this.replacementDeadline = time + 10000;
    if (this.replacementDeadline !== undefined && time >= this.replacementDeadline) {
      this.returning = true;
      this.returned = true;
      this.replacementDeadline = undefined;
      this.replacementPending = false;
    }
  }

  private advance(site: NonNullable<RoadLook["lindeDelivery"]>, time: number) {
    if (site.node > this.node && this.doneAt !== undefined && time - this.doneAt >= 400) {
      this.node++;
      this.residentHold = false;
      this.at = undefined;
      this.doneAt = undefined;
    }
    if (
      site.completed &&
      this.node === 14 &&
      this.doneAt !== undefined &&
      time - this.doneAt >= 400
    )
      this.returning = true;
    if (site.instant) {
      this.returning = true;
      this.returned = true;
    }
  }

  private target(
    id: Traveller["id"],
    fighting: boolean,
    view?: RoadViewport,
    portrait?: boolean,
  ): readonly [number, number] {
    const recipient = recipients[Math.floor(this.node / 3) % 2];
    if (id === this.courier && !fighting && view) {
      const pickup = this.pickup.target(id, view, portrait);
      if (pickup) return pickup;
    }
    if (id === this.courier && !fighting && !this.returning)
      return [recipient.x + this.side * (id === "finn" || id === "mira" ? 80 : 99), recipient.y];
    return (
      {
        aria: [510, 620],
        leon: [660, 650],
        mira: [810, 620],
        finn: [960, 650],
        lico: [1100, 640],
      } as const
    )[id];
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.lindeDelivery || !scene) return;
    const active = Math.floor(this.node / 3) % 2;
    const fighting = battle.enemies.some((enemy) => enemy.hp > 0);
    this.pickup.rememberParty(battle, view, look.lindeDelivery.portrait);
    if (this.sideRecipient !== active) {
      this.sideRecipient = active;
      this.side = -1;
    }
    this.updateSide(battle, view, active, fighting, look.lindeDelivery.portrait);
    this.residents(scene, view, active, this.residentIdle(fighting), look.lindeDelivery.portrait);
    if (fighting || this.coldDone) {
      if (fighting) this.pickup.clearMemory();
      this.at = undefined;
      return;
    }
    const hero = battle.heroes.find((h) => h.id === this.courier);
    if (this.pickup.active) {
      this.finishPickup(battle, scene, hero, view, look.lindeDelivery.portrait);
      return;
    }
    if (!hero) return;
    if (this.returning) {
      this.returnToParty(battle, scene, hero, view, active, look);
      return;
    }
    this.finishHandoff(battle, scene, hero, view, active, look.lindeDelivery.portrait);
  }

  private updateSide(
    battle: RoadBattle,
    view: RoadViewport,
    active: number,
    fighting: boolean,
    portrait?: boolean,
  ) {
    if (this.courier && !fighting && !this.returning && !this.pickup.active) {
      const nextSide = lindeHandoffSide(
        battle,
        view,
        recipients[active],
        this.courier,
        portrait,
        this.side,
      );
      if (nextSide !== this.side) this.pickup.residentTurns(battle.time);
      this.side = nextSide;
    }
  }

  private finishPickup(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller | undefined,
    view: RoadViewport,
    portrait?: boolean,
  ) {
    const result = hero && this.pickup.finish(hero, battle, view, portrait);
    const point = result?.point ?? this.pickup.point(battle.time, view, portrait);
    if (!point) return;
    if (hero && result?.pose) scene.poses[hero.id] = result.pose;
    const prop = housecallProp(
      view,
      "linde-letter",
      lindeDeliveryAssets.paper,
      point,
      25,
      lindeDeliveryLayout(view, portrait).scale,
    );
    prop.origin = { x: 0.5, y: 0.5 };
    prop.depth = Math.max(point.lane, hero?.lane ?? point.lane) + 0.04;
    scene.props.push(prop);
    if (result?.done) this.returning = result.returning;
  }

  private finishHandoff(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    active: number,
    portrait?: boolean,
  ) {
    const l = lindeDeliveryLayout(view, portrait);
    const arrived =
      !hero.walking && waterwayAt(hero, l.world(...this.target(hero.id, false)), view);
    const age = this.arrivalAge(arrived, battle.time);
    if (arrived) {
      this.replacementDeadline = undefined;
      this.replacementPending = false;
    }
    if (arrived) hero.facing = this.side === -1 ? 1 : -1;
    const stride = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: l.figureSize,
    });
    scene.poses[hero.id] = lindeCourierPose(hero.id, hero.walking, stride);
    this.letter(scene, hero, view, active, arrived ? age / 850 : 0, battle.time, portrait);
    if (this.residentHold) this.doneAt ??= battle.time;
    if (arrived && age >= 1300) this.doneAt ??= battle.time;
  }

  private returnToParty(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    active: number,
    look: RoadLook,
  ) {
    const l = lindeDeliveryLayout(view, look.lindeDelivery?.portrait);
    const arrived = !hero.walking && waterwayAt(hero, l.world(...this.target(hero.id, true)), view);
    const art = lindeCouriers[hero.id];
    if (!art) return;
    if (arrived) {
      this.returned = true;
      if (look.lindeDelivery) look.lindeDelivery.visualComplete = true;
      hero.facing = 1;
      scene.poses[hero.id] = { asset: art.offer, frame: art.offerFrame, rows: art.offerRows ?? 1 };
    } else {
      const stride = this.gait.frame(hero, {
        ...view,
        stage: battle.stage,
        figureSize: l.figureSize,
      });
      scene.poses[hero.id] = {
        asset: art.walk,
        frame: stride + 4 * (art.walkRow ?? 0),
        rows: art.walkRow ? 2 : 1,
      };
    }
    this.letter(scene, hero, view, active, 1, battle.time, look.lindeDelivery?.portrait);
  }

  private arrivalAge(arrived: boolean, time: number) {
    if (!arrived) this.at = undefined;
    else this.at ??= time;
    return Math.max(0, time - (this.at ?? time));
  }

  private residentIdle(fighting: boolean) {
    return fighting || this.returning || this.at === undefined;
  }

  private residents(
    scene: WaterwayActions,
    view: RoadViewport,
    active: number,
    fighting: boolean,
    portrait?: boolean,
  ) {
    const l = lindeDeliveryLayout(view, portrait);
    scene.actors = recipients.map((point, i) => ({
      id: `linde-resident-${String(i)}`,
      point: l.world(point.x, point.y),
      size: l.figureRatio,
      facing: i === active && this.side === 1 ? -1 : 1,
      pose: {
        asset: i === 0 ? lindeDeliveryAssets.merchant : lindeDeliveryAssets.parent,
        cell: 128,
        rows: i === 0 ? 1 : 2,
        frame: i === active && !fighting ? (i === 0 ? 1 : 2) : 0,
        square: { foot: 120, height: 104 },
      },
    }));
  }

  private letter(
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    active: number,
    progress: number,
    time: number,
    portrait?: boolean,
  ) {
    const l = lindeDeliveryLayout(view, portrait);
    const letter = lindeLetterPoint(
      hero,
      view,
      recipients[active],
      active,
      this.side,
      this.node % 3,
      progress,
      this.residentHold,
      portrait,
    );
    if (!letter) return;
    const point = this.pickup.residentPoint(letter.point, time, view, portrait);
    const prop = housecallProp(view, "linde-letter", lindeDeliveryAssets.paper, point, 25, l.scale);
    prop.origin = { x: 0.5, y: 0.5 };
    prop.depth = Math.max(hero.lane, letter.residentFoot.lane) + 0.04;
    scene.props.push(prop);
    this.pickup.remember(hero, point, letter.held, this.returning, view, portrait);
  }
}
