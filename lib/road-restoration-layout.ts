import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { housecallsLayout } from "./road-housecalls-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";

/** Map the same work coordinates onto the portrait courtyard without changing their scale. */
export function restorationSiteLayout(view: RoadViewport) {
  if (view.height <= view.width) return housecallsLayout(view);
  const imageScale = Math.max(view.width / 1024, view.height / 1536);
  const scale = imageScale * 0.78;
  const backdrop = {
    x: -(1024 * imageScale - view.width) * 0.66,
    y: (view.height - 1536 * imageScale) / 2,
    width: 1024 * imageScale,
    height: 1536 * imageScale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + (520 + (x - 722) * 0.78) * imageScale,
    y: backdrop.y + (790 + (y - 650) * 0.78) * imageScale,
  });
  const unproject = (x: number, y: number) => ({
    x: 722 + ((x - backdrop.x) / imageScale - 520) / 0.78,
    y: 650 + ((y - backdrop.y) / imageScale - 790) / 0.78,
  });
  const world = (x: number, y: number) => {
    const point = project(x, y);
    return {
      x: (point.x - roadX(0, 0, view.width)) / roadScale(view.width),
      lane: 0.68 + (point.y - view.height * 0.62) / roadDepth(view.width, view.height),
    };
  };
  const figureSize = 144 * scale;
  return {
    backdrop,
    scale,
    project,
    unproject,
    world,
    figureSize,
    figureRatio: figureSize / roadHeroSize(view.width, view.height),
  };
}

type State = NonNullable<RoadLook["restoration"]>;
export function restorationHeroes(
  battle: RoadBattle,
  view: RoadViewport,
  phase: number,
  installing: boolean,
): Traveller[] {
  const layout = restorationSiteLayout(view);
  return battle.heroes.map((hero) => ({
    ...hero,
    ...layout.world(...restorationTarget(hero.id, phase, installing, view.height > view.width)),
    walking: false,
    facing: hero.id === "aria" ? 1 : -1,
  }));
}
export function restorationStarts(
  state: State,
  alreadyStarted: boolean,
  rootRequested: boolean,
  rootElapsed: number,
) {
  return (
    state.node >= 11 &&
    !state.completed &&
    !alreadyStarted &&
    state.dialogue !== "pending" &&
    state.dialogue !== "root" &&
    (state.dialogue === undefined || rootRequested) &&
    (!rootRequested || rootElapsed >= 1200)
  );
}
export function finnGuideFrame(guiding: boolean, reduced: boolean, time: number) {
  return guiding ? 6 + (reduced ? 0 : Math.floor(time / 900) % 2) : 5;
}
export function restorationPhase(state: State, rootRequested: boolean, rootElapsed: number) {
  if (rootRequested && rootElapsed < 1200) return 0;
  return state.dialogue === "plan" ? 1 : state.node % 3;
}
export function restorationGuiding(state: State, phase: RoadBattle["phase"]) {
  return (
    phase === "journey" &&
    (state.dialogue === undefined
      ? Math.floor(state.node / 3) % 3 === 0
      : state.dialogue === "guide")
  );
}
export function restorationTarget(
  id: Traveller["id"],
  phase: number,
  installing = false,
  portrait = false,
): [number, number] {
  const positions: Partial<Record<Traveller["id"], [number, number]>> = {
    aria: phase === 0 ? [645, 674] : [540, 725],
    leon: installing ? [955, 750] : phase === 1 ? [930, 795] : [905, 735],
    mira: portrait ? [980, 550] : [1105, 688],
    finn: portrait ? [1140, 774] : [1400, 774],
  };
  return positions[id] ?? [1310, 875];
}
