import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions, WaterwayPoint } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import { housecallsAssets, housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallCarryPose, housecallPalm, housecallProp } from "./road-housecalls-contacts.ts";
import { RoadGait } from "./road-gait.ts";
import { roadDepth, roadScale } from "./road-layout.ts";
import { chapterThreeWork } from "./chapter-three.ts";
import {
  stoneReturnAssets,
  stoneReturnScene,
  stoneReturnTarget,
} from "./road-stone-selection-return.ts";

export const stoneSelectionAssets = {
  ...housecallsAssets,
  bank: "/storybook-study/stone-yard-v1.png",
  mason: "/storybook-study/mason-motion-v1.webp",
  ...stoneReturnAssets,
  cloth: "/storybook-study/light-cloth-v1.webp",
  notes: "/storybook-study/leon-route-notes-v1.webp",
  inspect: "/storybook-study/aria-work-v1.webp",
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = { x: number; y: number };
type Step = "pickup" | "carry" | "done";
const source = (i: number): Point => ({ x: 390 + i * 95, y: 550 });
const destination = (i: number): Point => ({ x: 760 + i * 105, y: 725 });
const candidates = ["blue", "violet", "dull", "dull", "violet"] as const;
const stoneWidth = 69;
// The asset is 256 × 320; with a 0.7 origin its bottom is 30% of its height below the anchor.
const stoneAnchorOffset = stoneWidth * (320 / 256) * 0.3;

export function presentStoneSelection(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "matching-lantern-stone" ||
    input.backgroundOverride !== stoneSelectionAssets.bank
  )
    return;
  look.stoneSelection = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: stoneSelectionAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const l = housecallsLayout(view);
  battle.heroes = battle.heroes.map((h, i) => ({
    ...h,
    ...l.world(450 + i * 155, 870),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(680, 725), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: stoneSelectionAssets.cloth,
    });
  }
}

/** A fixed yard: stones move from storage to the comparison group, never teleport to a hand. */
export class RoadStoneSelection {
  private key = "";
  private node = 0;
  private step: Step = "pickup";
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private reduced = false;
  private transitionAt?: number;
  private sorted = false;
  private gait = new RoadGait();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    const site = frame.look.stoneSelection;
    if (!site) return frame;
    this.reduced = reduced;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.coldDone = site.completed;
      this.step = this.coldDone ? "done" : "pickup";
      this.at = undefined;
      this.doneAt = undefined;
      this.transitionAt = undefined;
      this.sorted = this.coldDone;
      this.gait = new RoadGait();
    }
    if (
      site.node > this.node &&
      this.step === "done" &&
      frame.battle.time - (this.doneAt ?? frame.battle.time) >= 400
    ) {
      this.node++;
      this.step = "pickup";
      this.at = undefined;
      this.doneAt = undefined;
    }
    const fade = this.transition(frame.battle.time);
    const l = housecallsLayout(view);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
      heroes: frame.battle.heroes.map((hero) => ({
        ...hero,
        ...l.world(...this.target(hero.id)),
        walking: false,
        facing: hero.id === "aria" || (hero.id === "leon" && this.node % 3 === 0) ? 1 : -1,
      })),
    };
    if (battle.gathering) Object.assign(battle.gathering, l.world(680, 725));
    const look = {
      ...frame.look,
      stoneSelection: { ...site, node: this.node, sorted: this.sorted, fade },
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("matching-lantern-stone", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private transition(time: number) {
    if (this.node !== 14 || this.coldDone) return 0;
    this.transitionAt ??= time;
    if (this.reduced) {
      this.sorted = true;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    this.sorted = elapsed >= 400;
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private target(id: Traveller["id"]): [number, number] {
    if (this.sorted) return stoneReturnTarget(id);
    const round = Math.floor(this.node / 3);
    if (id === "leon" && this.node % 3 === 0 && !this.coldDone) {
      const p = this.step === "pickup" ? source(round) : destination(round);
      return [p.x - 68, p.y + 35];
    }
    const p = destination(round);
    const spots: Partial<Record<Traveller["id"], [number, number]>> = {
      aria: this.node % 3 === 0 ? [1220, 650] : [p.x - 72, p.y + 28],
      leon: [p.x + 95, p.y + 85],
      mira: [360, 875],
      finn: [1100, 900],
    };
    return spots[id] ?? [1260, 850];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.stoneSelection || !scene) return;
    if (this.sorted) {
      stoneReturnScene(scene, view, stoneSelectionAssets.mason);
      return;
    }
    this.scenery(scene, view);
    if (this.coldDone || (look.stoneSelection.completed && this.node === 14)) return;
    if (this.step === "done" && this.node % 3 === 0) return;
    this.work(battle, scene, view);
  }
  private scenery(scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view),
      round = Math.floor(this.node / 3);
    scene.actors = [
      {
        id: "selection-mason",
        point: l.world(740, 480),
        size: l.figureRatio,
        pose: {
          asset: stoneSelectionAssets.mason,
          cell: 128,
          rows: 2,
          frame: 0,
          square: { foot: 120, height: 104 },
        },
      },
    ];
    for (let i = 0; i < candidates.length; i++) {
      if (i === round && this.node % 3 === 0 && !this.coldDone && this.step !== "done") continue;
      const moved =
        this.coldDone ||
        i < round ||
        (i === round && (this.node % 3 !== 0 || this.step === "done"));
      const p = moved ? destination(i) : source(i);
      scene.props.push(
        housecallProp(
          view,
          `selection-stone-${String(i)}`,
          stoneSelectionAssets[candidates[i]],
          l.world(p.x, p.y),
          stoneWidth,
        ),
      );
    }
  }
  private work(battle: RoadBattle, scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view);
    const heroId = this.node % 3 === 1 ? "aria" : "leon";
    const hero = battle.heroes.find((h) => h.id === heroId);
    if (!hero) return;
    const arrived = !hero.walking && waterwayAt(hero, l.world(...this.target(hero.id)), view);
    if (arrived) this.at ??= battle.time;
    const age = Math.max(0, battle.time - (this.at ?? battle.time));
    if (this.node % 3 === 0) this.carry(battle, scene, hero, view, arrived, age);
    else if (arrived) {
      if (heroId === "aria") hero.facing = 1;
      this.inspect(scene, heroId, battle.time, age);
      if (heroId === "aria") this.cloth(scene, hero, view);
    }
  }
  private cloth(scene: WaterwayActions, hero: Traveller, view: RoadViewport) {
    const prop = housecallProp(
      view,
      "selection-cloth",
      stoneSelectionAssets.cloth,
      this.comparisonPalm(hero, view),
      35,
    );
    prop.origin = { x: 0.5, y: 0 };
    prop.depth = hero.lane + 0.03;
    scene.props.push(prop);
  }
  private comparisonPalm(hero: Traveller, view: RoadViewport): WaterwayPoint {
    // The kneeling atlas has its hand lower and farther forward than the standing carry pose.
    const scale = (housecallsLayout(view).figureSize * 0.9) / 144;
    return {
      x: hero.x + ((130 - 96) * scale * hero.facing) / roadScale(view.width),
      lane: hero.lane + ((130 - 176) * scale) / roadDepth(view.width, view.height),
    };
  }
  private inspect(scene: WaterwayActions, heroId: "aria" | "leon", time: number, age: number) {
    scene.poses[heroId] = {
      asset: heroId === "aria" ? stoneSelectionAssets.inspect : stoneSelectionAssets.notes,
      frame: 1 + (this.reduced ? 0 : Math.floor(time / 700) % 3),
    };
    if (age >= 1300) this.done(time);
  }
  private carry(
    battle: RoadBattle,
    scene: WaterwayActions,
    hero: Traveller,
    view: RoadViewport,
    arrived: boolean,
    age: number,
  ) {
    const l = housecallsLayout(view),
      round = Math.floor(this.node / 3);
    const stride = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: l.figureSize,
    });
    const pickup = this.step === "pickup";
    if (!hero.walking || !pickup)
      scene.poses.leon = housecallCarryPose(hero, pickup, this.reduced ? 0 : stride);
    const from = l.world(source(round).x, source(round).y - stoneAnchorOffset);
    const to = l.world(destination(round).x, destination(round).y - stoneAnchorOffset);
    const palm = housecallPalm(hero, view, stride);
    const point = this.carriedPoint(
      pickup,
      arrived,
      this.reduced && arrived ? 700 : age,
      from,
      to,
      palm,
    );
    const prop = housecallProp(
      view,
      `selection-stone-${String(round)}`,
      stoneSelectionAssets[candidates[round]],
      point,
      stoneWidth,
    );
    prop.origin = { x: 0.5, y: 0.7 };
    prop.depth = Math.max(prop.depth, hero.lane + 0.03);
    scene.props.push(prop);
    if (!arrived || age < 700) return;
    if (pickup) {
      this.step = "carry";
      this.at = undefined;
    } else this.done(battle.time);
  }
  private carriedPoint(
    pickup: boolean,
    arrived: boolean,
    age: number,
    from: WaterwayPoint,
    to: WaterwayPoint,
    palm: WaterwayPoint,
  ) {
    if (pickup) return waterwayMix(from, palm, arrived ? age / 700 : 0);
    return arrived ? waterwayMix(palm, to, age / 700) : palm;
  }
  private done(time: number) {
    this.step = "done";
    this.doneAt ??= time;
  }
}
