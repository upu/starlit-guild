import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { housecallsAssets as assets, housecallsLayout } from "./road-housecalls-layout.ts";
export function presentHousecalls(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "waiting-households" ||
    input.backgroundOverride !== assets.bank
  )
    return;
  look.housecalls = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: assets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  battle.distance = 0;
  battle.stage = "forest";
  battle.effects = [];
  const layout = housecallsLayout(view);
  battle.heroes = battle.heroes.map((h, i) => ({
    ...h,
    ...layout.world(700 + i * 140, 790),
    walking: false,
    facing: 1,
  }));
  if (battle.gathering && look.work) {
    const point = layout.world(965, 550);
    Object.assign(battle.gathering, { ...point, x: point.x - 65, task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: assets.parcel,
    });
  }
}
