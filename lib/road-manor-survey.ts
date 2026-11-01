import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { waterwayAt, waterwayMix } from "./road-waterway-contacts.ts";
import { housecallsAssets, housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallPalm, housecallProp } from "./road-housecalls-contacts.ts";
import { chapterThreeWork } from "./chapter-three.ts";
import { RoadGait } from "./road-gait.ts";
import {
  surveyReturnAssets,
  surveyReturnScene,
  surveyReturnTarget,
} from "./road-manor-survey-return.ts";

export const manorSurveyAssets = {
  ...housecallsAssets,
  bank: "/storybook-study/manor-back-paths-v1.png",
  gardener: "/storybook-study/gardener-motion-v1.webp",
  pot: "/storybook-study/garden-pot-v1.webp",
  cloth: "/storybook-study/spare-cloth-folded-v1.webp",
  miraWork: "/storybook-study/mira-earthwork-v1.webp",
  leonNotes: "/storybook-study/leon-route-notes-v1.webp",
  ...surveyReturnAssets,
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Step = "pickup" | "carry" | "done";
const from = { x: 390, y: 580 };
const to = (round: number) => ({ x: 850 + round * 75, y: 515 });

export function presentManorSurvey(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "manor-survey" ||
    input.backgroundOverride !== manorSurveyAssets.bank
  )
    return;
  look.manorSurvey = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: manorSurveyAssets.bank,
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
    ...l.world(450 + i * 150, 850),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(720, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: manorSurveyAssets.cloth,
    });
  }
}

/** The kitchen pot was returned before departure; these are the gardener's flower pots. */
export class RoadManorSurvey {
  private key = "";
  private node = 0;
  private step: Step = "pickup";
  private at?: number;
  private doneAt?: number;
  private coldDone = false;
  private reduced = false;
  private transitionAt?: number;
  private gathering = false;
  private gait = new RoadGait();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    const site = frame.look.manorSurvey;
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
      this.gathering = this.coldDone;
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
        facing: hero.id === "aria" ? 1 : -1,
      })),
    };
    if (battle.gathering) Object.assign(battle.gathering, l.world(720, 650));
    const look = {
      ...frame.look,
      manorSurvey: { ...site, node: this.node, gathering: this.gathering, fade },
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("manor-survey", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private transition(time: number) {
    if (this.node !== 14 || this.coldDone) return 0;
    this.transitionAt ??= time;
    if (this.reduced) {
      this.gathering = true;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    this.gathering = elapsed >= 400;
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private target(id: Traveller["id"]): [number, number] {
    if (this.gathering) return surveyReturnTarget(id);
    if (id === "aria" && this.node % 3 === 0 && !this.coldDone) {
      const p = this.step === "pickup" ? from : to(Math.floor(this.node / 3));
      return [p.x, p.y];
    }
    const positions: Partial<Record<Traveller["id"], [number, number]>> = {
      aria: [505, 750],
      leon: this.node % 3 === 2 ? [490, 500] : [790, 790],
      mira: [650, 755],
      finn: [1060, 810],
    };
    return positions[id] ?? [1250, 850];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.manorSurvey || !scene) return;
    if (this.gathering) {
      surveyReturnScene(scene, view, manorSurveyAssets.gardener, manorSurveyAssets.pot);
      return;
    }
    this.scenery(scene, view);
    if (this.coldDone || (look.manorSurvey.completed && this.node === 14) || this.step === "done")
      return;
    this.work(battle, scene, view);
  }
  private work(battle: RoadBattle, scene: WaterwayActions, view: RoadViewport) {
    const heroId = this.node % 3 === 0 ? "aria" : this.node % 3 === 1 ? "mira" : "leon";
    const hero = battle.heroes.find((h) => h.id === heroId);
    if (!hero) return;
    const l = housecallsLayout(view);
    const arrived = !hero.walking && waterwayAt(hero, l.world(...this.target(hero.id)), view);
    if (arrived) this.at ??= battle.time;
    const age = Math.max(0, battle.time - (this.at ?? battle.time));
    if (this.node % 3 === 0) this.carry(battle, scene, hero, view, arrived, age);
    else if (arrived && heroId !== "aria") this.inspect(scene, heroId, battle.time, age);
  }
  private scenery(scene: WaterwayActions, view: RoadViewport) {
    const l = housecallsLayout(view),
      round = Math.floor(this.node / 3);
    scene.actors = [
      {
        id: "survey-gardener",
        point: l.world(1100, 410),
        size: l.figureRatio,
        pose: {
          asset: manorSurveyAssets.gardener,
          cell: 128,
          rows: 2,
          frame: 0,
          square: { foot: 120, height: 95 },
        },
      },
    ];
    scene.props.push(
      housecallProp(view, "survey-cloth", manorSurveyAssets.cloth, l.world(730, 780), 95),
    );
    const limit = this.coldDone ? 5 : round + (this.node % 3 > 0 || this.step === "done" ? 1 : 0);
    for (let i = 0; i < limit; i++) {
      const p = to(i);
      const prop = housecallProp(
        view,
        `survey-pot-${String(i)}`,
        manorSurveyAssets.pot,
        l.world(p.x, p.y - 57.5),
        55,
      );
      prop.origin = { x: 0.5, y: 0.5 };
      scene.props.push(prop);
    }
  }
  private inspect(scene: WaterwayActions, id: "mira" | "leon", time: number, age: number) {
    scene.poses[id] = {
      asset: id === "mira" ? manorSurveyAssets.miraWork : manorSurveyAssets.leonNotes,
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
      pickup = this.step === "pickup",
      end = to(Math.floor(this.node / 3));
    const stride = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: l.figureSize,
    });
    this.carryPose(scene, hero, pickup, stride);
    const palm = housecallPalm(hero, view, stride),
      a = l.world(from.x, from.y - 57.5),
      b = l.world(end.x, end.y - 57.5);
    const point = this.carriedPoint(pickup, arrived, age, a, b, palm);
    const prop = housecallProp(view, "survey-active", manorSurveyAssets.pot, point, 55);
    prop.origin = { x: 0.5, y: 0.5 };
    prop.depth = Math.max(prop.depth, hero.lane + 0.03);
    scene.props.push(prop);
    if (!arrived || age < 700) return;
    if (pickup) {
      this.step = "carry";
      this.at = undefined;
    } else this.done(battle.time);
  }
  private carryPose(scene: WaterwayActions, hero: Traveller, pickup: boolean, stride: number) {
    if (hero.walking && pickup) return;
    scene.poses.aria = pickup
      ? { asset: manorSurveyAssets.ariaLower, frame: 1 }
      : {
          asset: manorSurveyAssets.ariaCarry,
          frame: hero.walking && !this.reduced ? 4 + stride : 0,
          rows: 2,
        };
  }
  private carriedPoint(
    pickup: boolean,
    arrived: boolean,
    age: number,
    from: { x: number; lane: number },
    to: { x: number; lane: number },
    palm: { x: number; lane: number },
  ) {
    const progress = arrived ? (this.reduced ? 1 : age / 700) : 0;
    if (pickup) return waterwayMix(from, palm, progress);
    return arrived ? waterwayMix(palm, to, progress) : palm;
  }
  private done(time: number) {
    this.step = "done";
    this.doneAt ??= time;
  }
}
