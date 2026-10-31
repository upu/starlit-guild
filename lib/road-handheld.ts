import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { berneHandheld } from "./road-berne-journey.ts";
import { mossBedsLayout, fieldCastScale } from "./road-moss-beds-layout.ts";
import { forestHandheld, forestWorkReady } from "./road-forest-jar.ts";
import {
  picnicHandheld,
  picnicLeonPalms,
  picnicEncounterNear,
  picnicEffects,
} from "./road-picnic.ts";

export type HandheldView = { width: number; height: number };
export type HandheldItem = {
  hero: "aria" | "leon" | "mira" | "finn" | "lico";
  kind:
    | "bottles"
    | "medicine"
    | "moss-jar"
    | "forest-moss-jar"
    | "lunch-bag"
    | "bread-parcel"
    | "medicine-parcel"
    | "field-basket"
    | "transplant-basket"
    | "field-medicine"
    | "field-paper";
  phase: "held" | "lower" | "ground" | "lift";
  at: number;
  returning: boolean;
  point?: { x: number; lane: number };
  /** Reserved foot space while setting down or retrieving the transplant basket. */
  reservation?: { x: number; lane: number };
  facing: 1 | -1;
  /** Fixed-scene figures use a scale tied to the background painting. */
  sizeScale?: number;
};
type Frame = { battle: RoadBattle; look: RoadLook };
const ariaJar = (kind: "moss-jar" | "forest-moss-jar"): HandheldItem[] => [
  { hero: "aria", kind, phase: "held", at: 0, returning: false, facing: 1 },
];
const hands = {
  lico: [
    [124.5, 115.5],
    [112, 165],
    [112, 165],
    [124.5, 115.5],
    [124.5, 115.5],
    [124.5, 115.5],
    [124.5, 115.5],
    [124.5, 115.5],
  ],
  finn: [
    [116, 120],
    [132, 169],
    [123, 144],
    [116, 120],
    [116, 120],
    [116, 120],
    [116, 120],
    [116, 120],
  ],
  aria: [
    [119, 120],
    [121, 159],
    [131, 130],
    [116, 120],
    [109, 115],
    [107, 118],
    [113, 117],
    [118, 117],
  ],
  leon: [
    [81, 122],
    [100, 151],
    [88, 135],
    [79, 118],
    [72, 124],
    [78, 125],
    [77, 124],
    [80, 125],
  ],
  mira: [
    [109, 126],
    [132, 152],
    [123, 134],
    [113, 119],
    [108, 125],
    [109, 125],
    [108, 125],
    [106, 124],
  ],
};
/** Registered hand locations in the shared 192px handheld sprite cells. */
export const handheldPalm = (hero: HandheldItem["hero"], frame: number) => hands[hero][frame];
export const homewardHandheld = (look: RoadLook) =>
  !!look.storybookHeroes && look.quest === "medicine-road-home";
export const nightHandheld = (look?: RoadLook) =>
  !!look?.storybookHeroes && look.quest === "moss-night-road";
export const recordsHandheld = (look?: RoadLook) => !!look?.mossBeds?.records;
export const hasRoadHandheld = (look: RoadLook) =>
  homewardHandheld(look) ||
  nightHandheld(look) ||
  forestHandheld(look) ||
  picnicHandheld(look) ||
  berneHandheld(look) ||
  recordsHandheld(look);
export const handheldWidth = (kind: HandheldItem["kind"], view: HandheldView, sizeScale = 1) =>
  roadHeroSize(view.width, view.height) *
  sizeScale *
  {
    bottles: 0.25,
    medicine: 0.3,
    "moss-jar": 0.18,
    "forest-moss-jar": 0.18,
    "lunch-bag": 0.28,
    "bread-parcel": 0.3,
    "medicine-parcel": 0.28,
    "field-basket": 0.36,
    "transplant-basket": 0.342,
    "field-medicine": 0.31,
    "field-paper": 0.15,
  }[kind];
export function handheldFrame(
  item: HandheldItem,
  hero: Traveller,
  time: number,
  stride = 0,
  reduced = false,
) {
  if (item.phase === "lower") return time - item.at < 180 ? 2 : 1;
  if (item.phase === "lift") return liftingFrame(time - item.at);
  return hero.walking && !reduced ? 4 + (stride % 4) : 0;
}
function liftingFrame(age: number) {
  if (age < 220) return 1;
  return age < 420 ? 2 : 0;
}
/** The world point is always the object's bottom, including a handle-held bag. */
export function handheldPoint(
  item: HandheldItem,
  hero: Traveller,
  frame: number,
  view: HandheldView,
  stage: string,
) {
  const p = (item.kind === "bread-parcel" ? picnicLeonPalms : hands[item.hero])[frame],
    size = roadHeroSize(view.width, view.height),
    figure = (size * (item.sizeScale ?? 1) * 0.9) / 144;
  const drop =
    item.kind === "bottles"
      ? handheldWidth(item.kind, view)
      : item.kind === "field-basket" ||
          item.kind === "field-medicine" ||
          item.kind === "transplant-basket"
        ? handheldWidth(item.kind, view, item.sizeScale) *
          (item.kind === "field-medicine" ? 0.73 : 0.64)
        : item.kind === "medicine"
          ? size * 0.06
          : 0;
  return {
    x: hero.x + ((p[0] - 96) * figure * hero.facing) / roadScale(view.width, stage),
    lane: hero.lane + ((p[1] - 176) * figure + drop) / roadDepth(view.width, view.height),
  };
}
function pickupFoot(item: HandheldItem, hero: Traveller, view: HandheldView, stage: string) {
  const offset = handheldPoint(
    item,
    { ...hero, x: 0, lane: 0, facing: item.facing },
    1,
    view,
    stage,
  );
  return {
    x: (item.point?.x ?? hero.x) - offset.x,
    lane: (item.point?.lane ?? hero.lane) - offset.lane,
  };
}

/** Renderer-only luggage state. Combat and saved coordinates are never changed. */
export class RoadHandheldMotion {
  private key = "";
  private items: HandheldItem[] = [];
  private last = new Map<string, Traveller>();
  private camera?: number;
  private lastCamera?: number;

  prepare(frame: Frame, key: string, view: HandheldView): Frame {
    if (!hasRoadHandheld(frame.look)) {
      this.reset("");
      return frame;
    }
    if (this.key !== key) this.reset(key, frame.look);
    this.sizeRecordsItems(frame.look, view);
    const picnic = picnicHandheld(frame.look) || berneHandheld(frame.look);
    const fighting = picnic
      ? !this.items.some((i) => i.returning || i.phase === "lift") &&
        picnicEncounterNear(frame.battle, this.last)
      : frame.battle.enemies.some((e) => e.hp > 0) ||
        forestWorkReady(frame.battle, frame.look, view, this.items, this.last.get("aria"));
    this.syncPhases(frame.battle, fighting, view, recordsHandheld(frame.look));
    const retrieving = this.items.some((i) => i.returning);
    const staging = retrieving || this.items.some((i) => i.phase === "lower" || i.phase === "lift");
    this.updateCamera(frame, staging, retrieving, picnic);
    const heroes = frame.battle.heroes.map((hero) =>
      this.targetHero(hero, frame.battle, view, berneHandheld(frame.look)),
    );
    const fixed = this.items
      .filter(
        (i) => i.phase === "lower" || i.phase === "lift" || i.returning || (picnic && retrieving),
      )
      .map((i) => i.hero);
    return {
      battle: {
        ...frame.battle,
        heroes,
        handheld: this.items.map((i) => ({ ...i })),
        distance: this.drawDistance(frame.battle, picnic),
        effects: picnic ? picnicEffects(frame.battle, this.items) : frame.battle.effects,
      },
      look: { ...frame.look, workers: [...new Set([...frame.look.workers, ...fixed])] },
    };
  }
  private sizeRecordsItems(look: RoadLook, view: HandheldView) {
    if (recordsHandheld(look))
      for (const item of this.items)
        item.sizeScale =
          mossBedsLayout(view).figureRatio * fieldCastScale(view.height > view.width);
  }
  private updateCamera(frame: Frame, staging: boolean, retrieving: boolean, picnic: boolean) {
    if (!staging) this.camera = undefined;
    else if (this.camera === undefined)
      this.camera = recordsHandheld(frame.look)
        ? 0
        : retrieving
          ? this.pickupCamera(frame.battle.distance, picnic)
          : (this.lastCamera ?? frame.battle.distance);
  }
  private drawDistance(battle: RoadBattle, picnic: boolean) {
    const arrival = picnic && battle.phase === "arrived";
    return this.camera ?? (arrival ? (this.lastCamera ?? battle.distance) : battle.distance);
  }
  finish(battle: RoadBattle, view: HandheldView) {
    this.lastCamera = battle.distance;
    for (const item of this.items) {
      const hero = battle.heroes.find((h) => h.id === item.hero);
      if (!hero) continue;
      this.tryLift(item, hero, battle, view);
      if (item.phase === "lift" && battle.time - item.at >= 600) {
        item.phase = "held";
        item.returning = false;
      }
      if (item.kind === "forest-moss-jar" && (item.phase === "lower" || item.phase === "lift"))
        hero.facing = item.facing;
    }
    for (const hero of battle.heroes) this.last.set(hero.id, { ...hero });
    return this.items.map((i) => ({ ...i, point: i.point && { ...i.point } }));
  }
  private tryLift(item: HandheldItem, hero: Traveller, battle: RoadBattle, view: HandheldView) {
    if (item.phase !== "ground" || !item.returning || !roadTravellerCanMove(hero)) return;
    const foot = pickupFoot(item, hero, view, battle.stage);
    if (
      Math.abs(hero.x - foot.x) * roadScale(view.width, battle.stage) < 2 &&
      Math.abs(hero.lane - foot.lane) < 0.02
    ) {
      item.phase = "lift";
      item.at = battle.time;
    }
  }
  private reset(key: string, look?: RoadLook) {
    this.key = key;
    this.last.clear();
    this.camera = undefined;
    this.lastCamera = undefined;
    this.items = this.initialItems(key, look);
  }
  private initialItems(key: string, look?: RoadLook): HandheldItem[] {
    if (recordsHandheld(look))
      return [
        { hero: "aria", kind: "field-basket", phase: "held", at: 0, returning: false, facing: 1 },
        { hero: "mira", kind: "field-medicine", phase: "held", at: 0, returning: false, facing: 1 },
        { hero: "finn", kind: "field-paper", phase: "held", at: 0, returning: false, facing: 1 },
      ];
    if (berneHandheld(look))
      return [
        {
          hero: "finn",
          kind: "medicine-parcel",
          phase: "held",
          at: 0,
          returning: false,
          facing: 1,
        },
        {
          hero: "leon",
          kind: "medicine-parcel",
          phase: "held",
          at: 0,
          returning: false,
          facing: 1,
        },
        { hero: "mira", kind: "medicine", phase: "held", at: 0, returning: false, facing: 1 },
      ];
    if (forestHandheld(look)) return ariaJar("forest-moss-jar");
    return picnicHandheld(look)
      ? [
          { hero: "aria", kind: "lunch-bag", phase: "held", at: 0, returning: false, facing: 1 },
          { hero: "leon", kind: "bread-parcel", phase: "held", at: 0, returning: false, facing: 1 },
        ]
      : nightHandheld(look)
        ? ariaJar("moss-jar")
        : key
          ? [
              { hero: "leon", kind: "bottles", phase: "held", at: 0, returning: false, facing: 1 },
              { hero: "mira", kind: "medicine", phase: "held", at: 0, returning: false, facing: 1 },
            ]
          : [];
  }
  private pickupCamera(fallback: number, earliest = false) {
    const points = this.items.flatMap((i) => (i.returning && i.point ? [i.point.x] : []));
    if (!points.length) return fallback;
    return earliest ? Math.min(...points) : points.reduce((a, b) => a + b, 0) / points.length;
  }
  private syncPhases(battle: RoadBattle, fighting: boolean, view: HandheldView, records: boolean) {
    for (const item of this.items) {
      const hero = battle.heroes.find((h) => h.id === item.hero);
      if (!hero) continue;
      this.dropIfNeeded(item, hero, battle, view, fighting);
      if (item.phase === "lower" && battle.time - item.at >= 450) item.phase = "ground";
      this.returnIfReady(item, hero, fighting, records);
    }
  }
  private returnIfReady(item: HandheldItem, hero: Traveller, fighting: boolean, records: boolean) {
    if (fighting) {
      item.returning = false;
      return;
    }
    if (roadTravellerCanMove(hero) && (!records || !hero.paralyzed) && item.phase === "ground")
      item.returning = true;
  }
  private dropIfNeeded(
    item: HandheldItem,
    hero: Traveller,
    battle: RoadBattle,
    view: HandheldView,
    fighting: boolean,
  ) {
    if (!fighting && roadTravellerCanMove(hero)) return;
    if (item.phase !== "held") return;
    // A run may open on a battle. Establish the drawn, separated feet before
    // fixing luggage on the ground; raw initial positions can overlap.
    if (!this.last.has(hero.id)) return;
    const base = this.last.get(hero.id) ?? hero;
    // Aria works on the left of the moss. Put the jar outside her stance,
    // not among the leaves she and Leon are inspecting.
    item.facing = item.kind === "forest-moss-jar" ? -1 : base.facing;
    item.point = handheldPoint(item, { ...base, facing: item.facing }, 1, view, battle.stage);
    item.phase = "lower";
    item.at = battle.time;
  }
  private targetHero(hero: Traveller, battle: RoadBattle, view: HandheldView, berne: boolean) {
    const item = this.items.find((i) => i.hero === hero.id);
    if (berne && battle.phase === "arrived" && !item) {
      const previous = this.last.get(hero.id);
      if (previous) return { ...hero, x: previous.x, lane: previous.lane, walking: false };
    }
    if (item && this.waitingWithItem(item, battle)) {
      const previous = this.last.get(hero.id);
      if (previous) return { ...hero, x: previous.x, lane: previous.lane, walking: false };
    }
    if (!item || (!item.returning && item.phase !== "lower" && item.phase !== "lift")) return hero;
    return {
      ...hero,
      ...pickupFoot(item, hero, view, battle.stage),
      walking: false,
      facing: item.facing,
    };
  }
  private waitingWithItem(item: HandheldItem, battle: RoadBattle) {
    return (
      (item.kind === "bread-parcel" ||
        item.kind === "lunch-bag" ||
        this.items.some((i) => i.kind === "medicine-parcel")) &&
      item.phase === "held" &&
      (battle.phase === "arrived" || this.items.some((i) => i.returning || i.phase === "lift"))
    );
  }
}
