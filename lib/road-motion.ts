import type { RoadLook } from "./chapter-road-presentation.ts";
import { RoadWaterwayMotion } from "./road-waterway-motion.ts";
import { RoadPackingActions } from "./road-packing-actions.ts";
import { RoadSignpostActions } from "./road-signpost-actions.ts";
import { RoadHousecallsActions } from "./road-housecalls-actions.ts";
import { RoadBerneCallsActions } from "./road-berne-calls.ts";
import { RoadFoundationActions } from "./road-berne-foundation.ts";
import { RoadForestCompletion } from "./road-forest-completion.ts";
import { RoadWaterwaySearchCompletion } from "./road-waterway-search-completion.ts";
import { RoadManorDeliveries } from "./road-manor-deliveries.ts";
import { RoadStoneSelection } from "./road-stone-selection.ts";
import { RoadManorSurvey } from "./road-manor-survey.ts";
import { RoadGardenReception } from "./road-garden-reception.ts";
import { RoadNightBridge } from "./road-night-bridge.ts";
import { RoadBerneRestoration } from "./road-berne-restoration.ts";
import { RoadLindeDelivery } from "./road-linde-delivery.ts";
import { RoadLanternRoad } from "./road-lantern-road.ts";
import { RoadBrekkaLedger } from "./road-brekka-ledger.ts";
import { BrekkaSceneReset, RoadBrekkaJourney } from "./road-brekka-journey.ts";
import { RoadMossTrail } from "./road-moss-trail.ts";
import { RoadMossBeds } from "./road-moss-beds.ts";
import { RoadSeedlingMelee } from "./road-seedling-melee.ts";
import { SeedlingEscortSide } from "./road-seedling-escort.ts";
import { RoadFoundingHandoff } from "./road-founding-handoff.ts";
import { sceneObstacles } from "./road-scene-obstacles.ts";
import {
  followEffects,
  carryingCart,
  atWorkPosition,
  prunePartyPositions,
} from "./road-follow-effects.ts";
import { formationGap } from "./road-fixed-scene-layout.ts";
import { LindeReprojection } from "./road-linde-reproject.ts";
import { RoadFixedSceneReset } from "./road-fixed-scene-reset.ts";
import { approach } from "./road-motion-math.ts";
import { finishGolemDefense } from "./road-golem-defense.ts";
import { finishBlockade } from "./road-blockade.ts";
import { RoadWaterwayActions } from "./road-waterway-actions.ts";
import { RoadAllHandheldMotion } from "./road-all-handheld.ts";
import * as basket from "./road-transplant-basket-lock.ts";
import {
  RoadJourneyCartMotion,
  journeyCartGrip,
  journeyCartNeedsFinish,
} from "./road-journey-cart.ts";
import {
  foundingArrivalHero,
  foundingCameraSpeed,
  foundingCameraTarget,
} from "./road-founding-formation.ts";
import { roadScale, roadX } from "./road-layout.ts";
import { foundingOpeningTargets } from "./road-founding-shafts.ts";
import { townParcelCarry, TownParcelLift, TownHandoffSync } from "./road-town-parcel.ts";
import { brekkaInitialPosition, freezeBrekkaNotesFrame } from "./road-brekka-notes.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import {
  avoidPartyStep,
  partyOverlap,
  partyBlockers,
  type PartyTarget,
  type PartyObstacle,
} from "./road-party-spacing.ts";

type Position = { x: number; lane: number };
type Frame = { battle: RoadBattle; look: RoadLook };

// Renderer-owned continuity only. Never persist these positions or use them for combat range.
export class RoadMotion {
  private waterwayActions = new RoadWaterwayActions();
  private waterway = new RoadWaterwayMotion();
  private packing = new RoadPackingActions();
  private journeyCart = new RoadJourneyCartMotion();
  private handheld = new RoadAllHandheldMotion();
  private signpost = new RoadSignpostActions();
  private housecalls = new RoadHousecallsActions();
  private berneCalls = new RoadBerneCallsActions();
  private foundation = new RoadFoundationActions();
  private forestCompletion = new RoadForestCompletion();
  private waterwaySearchCompletion = new RoadWaterwaySearchCompletion();
  private manorDelivery = new RoadManorDeliveries();
  private stoneSelection = new RoadStoneSelection();
  private manorSurvey = new RoadManorSurvey();
  private gardenReception = new RoadGardenReception();
  private nightBridge = new RoadNightBridge();
  private restoration = new RoadBerneRestoration();
  private lindeDelivery = new RoadLindeDelivery();
  private lanternRoad = new RoadLanternRoad();
  private brekkaLedger = new RoadBrekkaLedger();
  private brekkaJourney = new RoadBrekkaJourney();
  private mossTrail = new RoadMossTrail();
  private mossBeds = new RoadMossBeds();
  private seedlingMelee = new RoadSeedlingMelee();
  private seedlingEscort = new SeedlingEscortSide();
  private founding = new RoadFoundingHandoff();
  private key = "";
  private at = 0;
  private camera = 0;
  private viewport = "";
  private lindeReprojection = new LindeReprojection();
  private fixedSceneReset = new RoadFixedSceneReset();
  private bridgeSection?: number;
  private brekkaReset = new BrekkaSceneReset();
  private positions = new Map<string, Position>();
  private feet = new Map<string, Position>();
  private townParcelLift = new TownParcelLift();
  private townHandoffSync = new TownHandoffSync();

  update(frame: Frame, key: string, width: number, reduced = false, height = 320): Frame {
    const prepared = this.prepareScenes(frame, key, { width, height }, reduced);
    const { look } = prepared;
    const newParcelRun = key !== this.key;
    const raw = this.townParcelLift.prepare(prepared.battle, look, { width, height }, newParcelRun);
    // React snapshots can correct the projected clock backwards by a few milliseconds.
    // A resized viewport has different cart grips and spacing; old screen-space
    // coordinates must not turn a paused carrier into a distant walking figure.
    const viewport = `${String(width)}:${String(height)}`;
    const pausedResize = viewport !== this.viewport && raw.time === this.at;
    const reset = this.shouldReset(
      key,
      reduced,
      pausedResize && !look.lindeDelivery && !look.lanternRoad && !look.brekkaLedger,
      look,
    );
    this.viewport = viewport;
    if (reset) this.resetPositions();
    this.lindeReprojection.update(
      look,
      { width, height },
      reset,
      this.feet,
      this.positions,
      this.camera,
    );
    const dt = Math.max(0, Math.min(0.05, (raw.time - this.at) / 1000));
    const cameraTarget = foundingCameraTarget(raw, look);
    this.camera = reset
      ? cameraTarget
      : approach(this.camera, cameraTarget, dt, foundingCameraSpeed(raw, look));
    this.key = key;
    this.at = raw.time;
    const battle = { ...raw, distance: this.camera };
    prunePartyPositions(this.positions, this.feet, raw);
    const targets = this.seedlingEscort.targets(
      { battle: raw, look },
      { width, height },
      {
        camera: battle.distance,
        reduced,
        previous: this.positions.get("lico"),
        newRun: newParcelRun,
      },
    );
    const foot = formationGap(raw, width, height, look, !look.brekkaNotes);
    const obstacles = this.obstacles(battle, look, width, height, foot);
    if (look.foundation) obstacles.push(this.foundation.obstacle({ width, height }));
    foundingOpeningTargets(targets, look, { width, height }, this.positions.has("aria"));
    battle.heroes = this.moveParty(targets, battle, width, dt, foot, obstacles);
    const workers = look.workers.filter((id) => {
      const original = raw.heroes.find((hero) => hero.id === id);
      const drawn = battle.heroes.find((hero) => hero.id === id);
      return original && drawn && atWorkPosition(drawn, original, width, battle);
    });
    this.finishBasicActions(battle, look, width, height, reduced);

    if (carryingCart(battle)) this.faceAlongCart(battle, raw, width, look);
    followEffects(raw.heroes, battle);
    return {
      battle,
      look: this.finishTown(battle, look, workers, dt, reduced, newParcelRun, { width, height }),
    };
  }
  private finishTown(
    battle: RoadBattle,
    look: RoadLook,
    workers: string[],
    dt: number,
    reduced: boolean,
    reset: boolean,
    view: { width: number; height: number },
  ) {
    const displayedLook = { ...look, workers };
    this.townParcelLift.update(battle, displayedLook, dt, reduced, reset, view);
    this.townHandoffSync.update(battle, view, dt, reduced, reset, this.positions, this.feet);
    return displayedLook;
  }
  private finishBasicActions(
    battle: RoadBattle,
    look: RoadLook,
    width: number,
    height: number,
    reduced: boolean,
  ) {
    battle.handheld = this.handheld.finish(battle, look, { width, height });
    this.forestCompletion.update(battle, look, reduced);
    if (journeyCartNeedsFinish(look))
      battle.journeyCart = this.journeyCart.finish(battle, { width, height });
    this.waterway.finish(battle, { width, height });
    this.waterwayActions.finish(battle, { width, height }, look, reduced);
    this.waterwaySearchCompletion.update(battle, look, reduced);
    this.packing.finish(battle, look, { width, height }, reduced);
    this.signpost.finish(battle, look, { width, height });
    finishGolemDefense(battle, look, { width, height });
    finishBlockade(battle, look, { width, height });
    this.finishVisits(battle, look, width, height, reduced);
    this.finishFoundingArrival(battle, look, width, height);
  }
  private finishFoundingArrival(battle: RoadBattle, look: RoadLook, width: number, height: number) {
    const cart = battle.journeyCart;
    if (!cart || !look.foundingDraft?.arrivalScene) return;
    const camera = this.journeyCart.arriveFounding(look.length, { width, height }, battle.stage);
    if (camera === undefined) return;
    // At full black, move the party and camera together before the warehouse appears.
    cart.x = look.length;
    cart.phase = "parked";
    battle.distance = camera;
    battle.heroes = battle.heroes.map((hero) =>
      foundingArrivalHero(hero, cart, { width, height }, battle.stage, journeyCartGrip),
    );
    this.camera = camera;
    this.resetPositions();
  }
  private prepareScenes(
    frame: Frame,
    key: string,
    view: { width: number; height: number },
    reduced: boolean,
  ) {
    const forestFrame = this.forestCompletion.prepare(frame, key, view);
    const searchFrame = this.waterwaySearchCompletion.prepare(forestFrame, key, view);
    const siteFrame = this.waterway.prepare(searchFrame, key, view, reduced);
    const actionFrame = this.waterwayActions.prepare(siteFrame, key, view, reduced);
    const packingFrame = this.packing.prepare(actionFrame, key, view);
    const signpostFrame = this.signpost.prepare(packingFrame, key, view);
    const housecallsFrame = this.housecalls.prepare(signpostFrame, key, view);
    const berneCallsFrame = this.berneCalls.prepare(housecallsFrame, key, view);
    const foundationFrame = this.foundation.prepare(berneCallsFrame, key, view, reduced);
    const manorFrame = this.manorDelivery.prepare(foundationFrame, key, view, reduced);
    const stoneFrame = this.stoneSelection.prepare(manorFrame, key, view, reduced);
    const surveyFrame = this.manorSurvey.prepare(stoneFrame, key, view, reduced);
    const receptionFrame = this.gardenReception.prepare(surveyFrame, key, view, reduced);
    const bridgeFrame = this.nightBridge.prepare(receptionFrame, key, view, reduced);
    const restorationFrame = this.restoration.prepare(bridgeFrame, key, view, reduced);
    const lindeFrame = this.lindeDelivery.prepare(restorationFrame, key, view, reduced);
    const lanternFrame = this.lanternRoad.prepare(lindeFrame, key, view, reduced);
    const trailFrame = this.mossTrail.prepare(lanternFrame, key, view, reduced);
    const bedsFrame = this.seedlingMelee.prepare(
      this.mossBeds.prepare(trailFrame, view, key, reduced),
      key,
      view,
    );
    const journeyFrame = this.brekkaJourney.prepare(bedsFrame, key, view, reduced);
    const ledgerKey = journeyFrame.look.brekkaJourney
      ? `${key}:ledger:${String(journeyFrame.look.brekkaJourney.generation)}`
      : key;
    const ledgerFrame = this.brekkaLedger.prepare(journeyFrame, ledgerKey, view, reduced);
    const cartFrame = this.journeyCart.prepare(
      this.founding.observe(ledgerFrame, key),
      key,
      view,
      reduced,
    );
    const foundingFrame = this.founding.prepare(cartFrame, view, key, reduced);
    return freezeBrekkaNotesFrame(this.handheld.prepare(foundingFrame, key, view), this.feet);
  }

  private finishVisits(
    battle: RoadBattle,
    look: RoadLook,
    width: number,
    height: number,
    reduced: boolean,
  ) {
    this.housecalls.finish(battle, look, { width, height });
    this.berneCalls.finish(battle, look, { width, height });
    this.foundation.finish(battle, look, { width, height });
    this.manorDelivery.finish(battle, look, { width, height });
    this.stoneSelection.finish(battle, look, { width, height });
    this.manorSurvey.finish(battle, look, { width, height });
    this.gardenReception.finish(battle, look, { width, height });
    this.nightBridge.finish(battle, look, { width, height });
    this.restoration.finish(battle, look, { width, height }, reduced);
    this.lindeDelivery.finish(battle, look, { width, height });
    this.lanternRoad.finish(battle, look, { width, height }, reduced);
    this.brekkaLedger.finish(battle, look, { width, height });
    this.brekkaJourney.finish(battle, look, { width, height });
    this.mossTrail.finish(battle, look);
    this.mossBeds.finish(battle, look, { width, height }, reduced);
    this.seedlingMelee.finish(battle, look, { width, height });
    this.founding.finish(battle, look, { width, height }, reduced);
  }
  private shouldReset(key: string, reduced: boolean, pausedResize: boolean, look: RoadLook) {
    const brekkaChanged = this.brekkaReset.changed(look);
    const fixedChanged = this.fixedSceneReset.changed(look);
    const bridgeChanged = this.bridgeChanged(look);
    return (
      key !== this.key || reduced || pausedResize || fixedChanged || bridgeChanged || brekkaChanged
    );
  }
  private bridgeChanged(look: RoadLook) {
    const section = look.nightBridge?.section;
    const changed = this.bridgeSection !== undefined && section !== this.bridgeSection;
    this.bridgeSection = section;
    return changed;
  }
  private resetPositions() {
    this.positions.clear();
    this.feet.clear();
  }

  private faceAlongCart(battle: RoadBattle, raw: RoadBattle, width: number, look: RoadLook) {
    for (const drawn of battle.heroes) {
      const original = raw.heroes.find((hero) => hero.id === drawn.id);
      if (original && atWorkPosition(drawn, original, width, battle))
        drawn.facing = townParcelCarry(battle, look) ? original.facing : 1;
    }
  }

  private moveParty(
    targets: PartyTarget[],
    battle: RoadBattle,
    width: number,
    dt: number,
    gap: Position,
    obstacles: PartyObstacle[],
  ) {
    const placed = new Map<string, Traveller>();
    for (const target of targets) {
      const hero = battle.heroes.find((h) => h.id === target.id);
      if (hero) placed.set(hero.id, this.moveHero(hero, target, battle, width, dt, gap, obstacles));
    }
    return battle.heroes.map((hero) => placed.get(hero.id) ?? hero);
  }

  private obstacles(
    battle: RoadBattle,
    look: RoadLook,
    width: number,
    height: number,
    foot: Position,
  ) {
    return sceneObstacles(battle, look, width, height, foot, {
      recipient: this.founding.recipientMotion.position,
      dropped: this.founding.drop.ground,
      lico: this.seedlingMelee.licoPosition,
      leon: this.seedlingMelee.leonPosition,
    });
  }

  private moveHero(
    hero: Traveller,
    target: PartyTarget,
    battle: RoadBattle,
    width: number,
    dt: number,
    gap: Position,
    obstacles: PartyObstacle[],
  ): Traveller {
    // Width-normalized screen positions also absorb camera/forest-to-puppet framing changes.
    const x = target.x;
    const previous = this.positions.get(hero.id);
    const wanted = {
      x: previous ? approach(previous.x, x, dt, 280) : x,
      lane: previous ? approach(previous.lane, target.lane, dt, 0.9) : target.lane,
    };
    const blockers = partyBlockers(this.positions, target, gap, obstacles);
    const followingGrip =
      target.cartGrip &&
      previous &&
      Math.abs(previous.x - x) < 24 &&
      Math.abs(previous.lane - target.lane) < 0.03 &&
      !blockers.some((blocker) => partyOverlap(target, blocker, gap));
    let position = followingGrip
      ? { x, lane: target.lane }
      : previous
        ? avoidPartyStep(previous, wanted, target, blockers, gap, dt)
        : brekkaInitialPosition(target, blockers, gap);
    const basketLock = basket.transplantBasketLock(battle, hero, width);
    position = basketLock ?? position;
    position = basket.restingFootPosition(this.feet.get(hero.id), hero, position, battle, width);
    this.positions.set(hero.id, position);
    const moving = Math.abs(x - position.x) > 2 || Math.abs(target.lane - position.lane) > 0.012;
    const scale = roadScale(width, battle.stage);
    const origin = roadX(0, battle.distance, width, battle.stage);
    const foot = { x: ((position.x / 560) * width - origin) / scale, lane: position.lane };
    this.feet.set(hero.id, foot);
    return {
      ...hero,
      ...foot,
      facing: basket.transplantBasketFacing(hero, previous, position, battle, !!basketLock),
      walking: basket.transplantBasketWalking(hero, moving, !!basketLock),
    };
  }
}
