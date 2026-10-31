import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle } from "./road-view.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
import type { RoadLook } from "./road-look.ts";
import { waterwayMix, type WaterwayPoint } from "./road-waterway-contacts.ts";
import type { JourneyCart } from "./road-journey-cart.ts";
import { RoadGait } from "./road-gait.ts";

export const foundingRecipient = "/storybook-study/merchant-service-v1.webp";
export const foundingRecipientWalk = "/storybook-study/merchant-walk-v2.webp";
export const foundingRecipientCarryWalk = "/storybook-study/merchant-carry-walk-v1.webp";
export const foundingRecipientTurn = "/storybook-study/merchant-turn-carry-v2.webp";
export function foundingRecipientObstacles(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  point?: WaterwayPoint,
) {
  if (!point || !look.foundingDraft || !battle.enemies.some((enemy) => enemy.hp > 0)) return [];
  const size = roadHeroSize(view.width, view.height);
  return [
    {
      x: (roadX(point.x, battle.distance, view.width, battle.stage) / view.width) * 560,
      lane: point.lane,
      clearance: {
        x: ((size * 0.65 + 3) / view.width) * 560,
        lane: (size * 0.9) / roadDepth(view.width, view.height),
      },
    },
  ];
}
export function foundingBattleObstacles(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  positions?: { recipient?: WaterwayPoint; dropped?: WaterwayPoint },
) {
  const dropped = look.foundingDraft?.cue === "dropped" ? positions?.dropped : undefined;
  return [
    ...foundingRecipientObstacles(battle, look, view, positions?.recipient),
    ...foundingRecipientObstacles(battle, look, view, dropped),
  ];
}
// Palm centers measured on the 128px registered sheets; feet are at (64, 120).
const receivingPalm = [34, 67] as const;
const walkingPalms = [
  [41, 74],
  [42, 75],
  [40, 75],
  [41, 75],
] as const;
const turningPalms = [
  [29, 75],
  [43, 76],
  [68, 78],
  [74, 78],
] as const;
export function foundingRecipientFoot(cart: JourneyCart, view: RoadViewport, stage: string) {
  const size = roadHeroSize(view.width, view.height);
  return {
    x: cart.x + (size * 2.1) / roadScale(view.width, stage),
    lane: cart.lane - (size * 0.45) / roadDepth(view.width, view.height),
  };
}
export function foundingRecipientHand(
  foot: WaterwayPoint,
  view: RoadViewport,
  stage: string,
  side = 1,
  walkingFrame?: number,
) {
  const palm = walkingFrame === undefined ? receivingPalm : walkingPalms[walkingFrame % 4];
  return projectPalm(foot, palm, view, stage, side);
}
function projectPalm(
  foot: WaterwayPoint,
  [x, y]: readonly [number, number],
  view: RoadViewport,
  stage: string,
  side: number,
) {
  const size = roadHeroSize(view.width, view.height);
  return {
    x: foot.x + ((x - 64) * size * side) / (104 * roadScale(view.width, stage)),
    lane: foot.lane + ((y - 120) * size) / (104 * roadDepth(view.width, view.height)),
  };
}

export function foundingRecipientItemPoint(
  recipient: ReturnType<FoundingRecipient["update"]>,
  view: RoadViewport,
  stage: string,
) {
  if (recipient.pose.asset === foundingRecipientTurn)
    return projectPalm(recipient.point, turningPalms[recipient.pose.frame], view, stage, 1);
  if (recipient.pose.asset === foundingRecipientCarryWalk)
    return projectPalm(recipient.point, [78, 78], view, stage, 1);
  return foundingRecipientHand(
    recipient.point,
    view,
    stage,
    recipient.handSide,
    recipient.walking ? recipient.pose.frame : undefined,
  );
}
type Phase = "pickup" | "walk" | "give" | "return";
type RecipientBattle = Pick<RoadBattle, "time" | "distance" | "stage"> &
  Partial<Pick<RoadBattle, "heroes" | "enemies">>;
function battleRetreat(target: WaterwayPoint, battle: RecipientBattle, view: RoadViewport) {
  const enemies = battle.enemies ?? [];
  if (!enemies.some((enemy) => enemy.hp > 0)) return undefined;
  const fighters = [...(battle.heroes ?? []), ...enemies].filter((fighter) => fighter.hp > 0);
  return {
    ...target,
    lane: Math.min(
      target.lane,
      Math.min(...fighters.map((fighter) => fighter.lane)) -
        (roadHeroSize(view.width, view.height) * 1.2) / roadDepth(view.width, view.height),
    ),
  };
}
function recipientAsset(walking: boolean, phase: Phase) {
  if (walking) return phase === "return" ? foundingRecipientCarryWalk : foundingRecipientWalk;
  return phase === "return" ? foundingRecipientTurn : foundingRecipient;
}
function recipientFrame(walking: boolean, phase: Phase, stride: number, turnAge: number) {
  if (walking) return stride;
  if (phase === "return") return Math.min(3, Math.floor(turnAge / 150));
  return phase === "give" ? 1 : 0;
}
function recipientPose(walking: boolean, phase: Phase, stride: number, turnAge: number) {
  return {
    asset: recipientAsset(walking, phase),
    frame: recipientFrame(walking, phase, stride, turnAge),
    cell: 128,
    rows: 1,
    square: { foot: 120, height: 104 },
  };
}

function recipientWalking(leaving: boolean, turnAge: number, progress: number, entering: number) {
  return leaving ? turnAge >= 600 && progress < 1 : entering < 1;
}

/** The recipient approaches and leaves beyond the right edge while the cart is parked. */
export class FoundingRecipient {
  private entering?: { at: number; from: WaterwayPoint; duration: number };
  private leaving?: { at: number; to: WaterwayPoint; duration: number };
  private gait = new RoadGait();
  private previous?: { point: WaterwayPoint; at: number };
  private avoiding?: WaterwayPoint;

  get position() {
    return this.previous?.point;
  }

  reset() {
    this.entering = undefined;
    this.leaving = undefined;
    this.gait = new RoadGait();
    this.previous = undefined;
    this.avoiding = undefined;
  }

  update(
    phase: Phase,
    target: WaterwayPoint,
    battle: RecipientBattle,
    view: RoadViewport,
    avoid?: WaterwayPoint,
  ) {
    const edge = {
      x:
        battle.distance +
        (view.width * 0.65 + roadHeroSize(view.width, view.height)) /
          roadScale(view.width, battle.stage),
      lane: target.lane,
    };
    const duration = Math.max(
      1800,
      (Math.abs(edge.x - target.x) * roadScale(view.width, battle.stage) * 1000) / 80,
    );
    this.entering ??= { at: battle.time, from: edge, duration };
    const entering = Math.min(
      1,
      Math.max(0, (battle.time - this.entering.at) / this.entering.duration),
    );
    if (phase === "return") this.leaving ??= { at: battle.time, to: edge, duration };
    // The render clock can move backwards when a retained completion snapshot
    // replaces a newer frame. Keep the turn on its first pose until it catches up.
    const turnAge = this.leaving ? Math.max(0, battle.time - this.leaving.at) : 0;
    const leaving = this.leaving
      ? Math.min(1, Math.max(0, (turnAge - 600) / this.leaving.duration))
      : 0;
    const nominal = this.leaving
      ? waterwayMix(target, this.leaving.to, leaving)
      : waterwayMix(this.entering.from, target, entering);
    const { point, moving, retreating } = this.avoidRecovery(nominal, battle, view, avoid);
    const walking = moving || recipientWalking(!!this.leaving, turnAge, leaving, entering);
    const stride = this.gait.frame({ id: "recipient", ...point }, { ...view, stage: battle.stage });
    const facing: 1 | -1 = retreating ? -1 : 1;
    return {
      point,
      walking,
      ready: entering >= 1 && !this.avoiding,
      gone: !!this.leaving && leaving >= 1,
      handSide: this.leaving && turnAge >= 600 ? -1 : 1,
      pose: recipientPose(walking, phase, stride, turnAge),
      // Approach faces left; the turn and carrying walk face right in their source artwork.
      facing,
    };
  }

  /** Step away from a fallen item, then return to the receiving position. */
  private avoidRecovery(
    nominal: WaterwayPoint,
    battle: RecipientBattle,
    view: RoadViewport,
    avoid?: WaterwayPoint,
  ) {
    const scale = roadScale(view.width, battle.stage);
    const nominalSafe = avoid
      ? {
          ...nominal,
          x: Math.max(nominal.x, avoid.x + (roadHeroSize(view.width, view.height) * 1.25) / scale),
        }
      : nominal;
    const retreat = battleRetreat(nominalSafe, battle, view);
    const desired = retreat ?? nominalSafe;
    const elapsed = Math.max(0, Math.min(100, battle.time - (this.previous?.at ?? battle.time)));
    const from =
      this.avoiding ?? (avoid || retreat ? (this.previous?.point ?? nominal) : undefined);
    const step = recoveryStep(from, desired, elapsed, scale, roadDepth(view.width, view.height));
    const { point, moving, retreating } = step;
    if (from) this.avoiding = !avoid && !retreat && step.arrived ? undefined : point;
    this.previous = { point, at: battle.time };
    return { point, moving, retreating };
  }
}

function recoveryStep(
  from: WaterwayPoint | undefined,
  desired: WaterwayPoint,
  elapsed: number,
  scale: number,
  depth: number,
) {
  if (!from) return { point: desired, moving: false, retreating: false, arrived: true };
  const distance = Math.hypot((desired.x - from.x) * scale, (desired.lane - from.lane) * depth);
  const progress = distance ? Math.min(1, (80 * elapsed) / (1000 * distance)) : 1;
  const moving = distance > 0.5 && elapsed > 0;
  return {
    point: waterwayMix(from, desired, progress),
    moving,
    retreating: moving && desired.x > from.x,
    arrived: progress >= 1,
  };
}
