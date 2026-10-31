import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { restorationAssets } from "./road-restoration-assets.ts";
import { waterwayAt, type WaterwayActions } from "./road-waterway-contacts.ts";
import { restorationPlacement } from "./road-restoration-placement.ts";
import { restorationStoneProps } from "./road-restoration-stone.ts";
import { RoadGait } from "./road-gait.ts";
import { masonAppearance } from "./road-restoration-mason.ts";
import {
  restorationPhase,
  restorationGuiding,
  restorationTarget,
  finnGuideFrame,
  restorationStarts,
  restorationSiteLayout,
  restorationHeroes,
} from "./road-restoration-layout.ts";

export { restorationAssets } from "./road-restoration-assets.ts";
type Frame = { battle: RoadBattle; look: RoadLook };
const site = { x: 730, y: 650 };

export function presentBerneRestoration(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "berne-restoration" ||
    input.backgroundOverride !== restorationAssets.bank
  )
    return;
  look.restoration = {
    node: input.squad.run?.node ?? 14,
    completed: !!input.questComplete && !input.squad.run,
    dialogue: input.restorationDialogue,
  };
  Object.assign(look, {
    background: restorationAssets.bank,
    backgroundShade: 0,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const l = restorationSiteLayout(view);
  battle.heroes = battle.heroes.map((h, i) => ({
    ...h,
    ...l.world(470 + i * 170, 780),
    walking: false,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(site.x, site.y), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: restorationAssets.root,
    });
  }
}

export class RoadBerneRestoration {
  private key = "";
  private installed = false;
  private transitionAt?: number;
  private rootElapsed = 0;
  private rootRequested = false;
  private rootLast?: number;
  private installationAt?: number;
  private gait = new RoadGait();
  private mason = { x: 792, y: 570 };
  private masonLast?: number;
  private masonReady = false;
  private installOrigin = { x: 792, y: 570 };

  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const s = frame.look.restoration;
    if (!s) return frame;
    if (this.key !== key) this.reset(key, s.completed);
    // Begin during the fourth "clear the passage" task so the placement can
    // finish even when the player helps through the remaining work quickly.
    if (s.dialogue === "root") this.rootRequested = true;
    if (
      restorationStarts(s, this.installationAt !== undefined, this.rootRequested, this.rootElapsed)
    ) {
      this.installationAt = frame.battle.time;
      this.installOrigin = { ...this.mason };
    }
    if (s.completed) {
      this.installed = true;
      this.transitionAt = undefined;
    }
    const age =
      this.installationAt === undefined
        ? undefined
        : Math.max(0, frame.battle.time - this.installationAt);
    const fade = this.transition(
      age !== undefined && (reduced || age >= 3700),
      frame.battle.time,
      reduced,
    );
    const phase = restorationPhase(s, this.rootRequested, this.rootElapsed);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    battle.heroes = restorationHeroes(battle, view, phase, age !== undefined);
    return {
      battle,
      look: {
        ...frame.look,
        background: this.installed ? restorationAssets.repaired : restorationAssets.bank,
        restoration: {
          ...s,
          installed: this.installed,
          fade,
          installAge: age,
          visualComplete:
            this.installed && fade === 0 && (reduced || age === undefined || age >= 5400),
        },
        workers: [],
      },
    };
  }
  private reset(key: string, completed: boolean) {
    this.key = key;
    this.installed = completed;
    this.transitionAt = undefined;
    this.rootElapsed = 0;
    this.rootRequested = false;
    this.rootLast = undefined;
    this.installationAt = undefined;
    this.gait = new RoadGait();
    this.mason = { x: 792, y: 570 };
    this.masonLast = undefined;
    this.masonReady = false;
    this.installOrigin = { ...this.mason };
  }
  private transition(wanted: boolean, time: number, reduced: boolean) {
    if (!wanted || (this.installed && this.transitionAt === undefined)) return 0;
    if (reduced) {
      this.installed = true;
      this.transitionAt = undefined;
      return 0;
    }
    this.transitionAt ??= time;
    const elapsed = Math.max(0, time - this.transitionAt);
    if (elapsed >= 400) this.installed = true;
    if (elapsed >= 800) {
      this.transitionAt = undefined;
      return 0;
    }
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced: boolean) {
    const state = look.restoration,
      scene = battle.waterwayActions;
    if (!state || !scene) return;
    const phase = restorationPhase(state, this.rootRequested, this.rootElapsed);
    this.props(scene, battle, state, view, reduced);
    this.actors(
      scene,
      view,
      phase,
      state.completed || !battle.gathering || battle.phase !== "journey",
      battle.time,
      reduced,
      state,
    );
    this.poses(
      scene,
      battle,
      view,
      phase,
      state.completed,
      reduced,
      state.installAge !== undefined,
      state,
    );
  }
  private props(
    scene: WaterwayActions,
    battle: RoadBattle,
    state: NonNullable<RoadLook["restoration"]>,
    view: RoadViewport,
    reduced: boolean,
  ) {
    const l = restorationSiteLayout(view);
    for (const [id, asset, x, y, width] of [
      [
        "restoration-fence",
        restorationAssets.fence,
        view.height > view.width ? 1020 : 1270,
        710,
        145,
      ],
    ] as const)
      scene.props.push(housecallProp(view, id, asset, l.world(x, y), width, l.scale));
    restorationStoneProps(scene, state, view, reduced, restorationAssets);
    this.root(scene, battle, state, view, reduced);
  }
  private root(
    scene: WaterwayActions,
    battle: RoadBattle,
    state: NonNullable<RoadLook["restoration"]>,
    view: RoadViewport,
    reduced: boolean,
  ) {
    const l = restorationSiteLayout(view);
    if (state.completed) return;
    const dt = Math.max(0, Math.min(100, battle.time - (this.rootLast ?? battle.time)));
    this.rootLast = battle.time;
    const aria = battle.heroes.find((h) => h.id === "aria");
    if (
      aria &&
      aria.hp > 0 &&
      !aria.walking &&
      battle.gathering &&
      battle.phase === "journey" &&
      (state.dialogue === undefined ? state.node % 3 === 0 : this.rootRequested) &&
      state.installAge === undefined &&
      waterwayAt(aria, l.world(...restorationTarget("aria", 0)), view)
    )
      this.rootElapsed = Math.min(1200, this.rootElapsed + dt);
    const alpha = reduced
      ? this.rootElapsed >= 1200
        ? 0
        : 1
      : Math.max(0, 1 - this.rootElapsed / 1200);
    if (alpha > 0) {
      const root = housecallProp(
        view,
        "restoration-root",
        restorationAssets.root,
        l.world(695, 690),
        52,
        l.scale,
      );
      root.alpha = alpha;
      scene.props.push(root);
    }
  }
  private actors(
    scene: WaterwayActions,
    view: RoadViewport,
    phase: number,
    completed: boolean,
    time: number,
    reduced: boolean,
    state: NonNullable<RoadLook["restoration"]>,
  ) {
    const l = restorationSiteLayout(view);
    const placement =
      state.installAge === undefined
        ? undefined
        : restorationPlacement(state.installAge, reduced, this.installOrigin);
    const masonPose = placement?.pose ?? this.moveMason(phase, completed, time, reduced);
    if (placement) this.mason = placement.mason;
    scene.actors = [
      {
        id: "restoration-mason",
        point: l.world(this.mason.x, this.mason.y),
        size: l.figureRatio,
        facing: masonPose?.facing,
        pose: masonAppearance(masonPose, phase, completed, time, reduced, restorationAssets),
      },
      {
        id: "restoration-keeper",
        point: l.world(
          view.height > view.width ? 1100 : 1030,
          view.height > view.width ? 430 : 520,
        ),
        size: l.figureRatio,
        pose: {
          asset: restorationAssets.keeper,
          cell: 128,
          rows: 1,
          frame: 0,
          square: { foot: 120, height: 104 },
        },
      },
    ];
  }
  private moveMason(
    phase: number,
    completed: boolean,
    time: number,
    reduced: boolean,
  ): { type: "walk"; frame: number; facing: 1 | -1 } | undefined {
    const target = phase === 1 && !completed ? { x: 870, y: 650 } : { x: 792, y: 570 };
    const dt = Math.max(0, Math.min(0.1, (time - (this.masonLast ?? time)) / 1000));
    this.masonLast = time;
    const dx = target.x - this.mason.x,
      dy = target.y - this.mason.y;
    const distance = Math.hypot(dx, dy);
    const step = reduced ? distance : Math.min(distance, dt * 200);
    if (distance > 0)
      this.mason = {
        x: this.mason.x + (dx * step) / distance,
        y: this.mason.y + (dy * step) / distance,
      };
    this.masonReady = distance - step < 2;
    if (this.masonReady) return undefined;
    return {
      type: "walk" as const,
      frame: 1 + (Math.floor(time / 170) % 4),
      facing: dx > 0 ? -1 : 1,
    };
  }
  private poses(
    scene: WaterwayActions,
    battle: RoadBattle,
    view: RoadViewport,
    phase: number,
    completed: boolean,
    reduced: boolean,
    installing: boolean,
    state: NonNullable<RoadLook["restoration"]>,
  ) {
    const l = restorationSiteLayout(view);
    const guiding = restorationGuiding(state, battle.phase);
    for (const hero of battle.heroes) {
      if (this.finnWalking(scene, hero, battle, view, reduced)) continue;
      if (
        hero.walking ||
        hero.hp <= 0 ||
        completed ||
        !waterwayAt(
          hero,
          l.world(...restorationTarget(hero.id, phase, installing, view.height > view.width)),
          view,
        )
      )
        continue;
      if (hero.id === "finn")
        scene.poses.finn = {
          asset: restorationAssets.finn,
          frame: finnGuideFrame(guiding, reduced, battle.time),
          rows: 2,
        };
      else if (
        !installing &&
        battle.gathering &&
        battle.phase === "journey" &&
        (hero.id !== "aria" || state.dialogue === undefined || this.rootRequested)
      )
        this.workerPose(scene, hero, phase, battle.time, reduced);
    }
  }
  private finnWalking(
    scene: WaterwayActions,
    hero: Traveller,
    battle: RoadBattle,
    view: RoadViewport,
    reduced: boolean,
  ) {
    if (hero.id !== "finn" || hero.hp <= 0 || !hero.walking || reduced) return false;
    const frame = this.gait.frame(hero, {
      ...view,
      stage: battle.stage,
      figureSize: restorationSiteLayout(view).figureSize,
    });
    scene.poses.finn = { asset: restorationAssets.finnWalk, frame, rows: 1 };
    return true;
  }
  private workerPose(
    scene: WaterwayActions,
    hero: Traveller,
    phase: number,
    time: number,
    reduced: boolean,
  ) {
    if (hero.id === "aria" && phase === 0)
      scene.poses.aria = {
        asset: restorationAssets.aria,
        frame: 1 + (reduced ? 0 : Math.floor(time / 650) % 3),
      };
    if (hero.id === "leon" && phase === 1 && this.masonReady)
      scene.poses.leon = {
        asset: restorationAssets.leon,
        frame: 1 + (reduced ? 0 : Math.floor(time / 850) % 3),
      };
  }
}
