import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { lindeDeliveryAssets } from "./road-linde-delivery.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
export function presentLindeDelivery(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "linde-requests" ||
    input.backgroundOverride !== lindeDeliveryAssets.bank
  )
    return;
  look.lindeDelivery = {
    node: input.squad.run?.node ?? 14,
    completed: !!input.questComplete && !input.squad.run,
    instant: !!input.skipVisual,
    paused: input.paused,
  };
  Object.assign(look, {
    background: lindeDeliveryAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  const l = lindeDeliveryLayout(view),
    heroes = battle.heroes,
    enemies = battle.enemies;
  battle.distance = 0;
  battle.stage = "forest";
  battle.heroes = heroes.map((hero, i) => ({
    ...hero,
    ...l.world(500 + i * 140, 750),
    walking: false,
  }));
  battle.enemies = enemies.map((enemy, i) => ({
    ...enemy,
    ...l.world(740 + i * 85, 570 + i * 85),
  }));
  battle.effects = battle.effects.map((effect) => {
    const target = enemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    const patient = heroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    const source = heroes.findIndex((h) => h.x === effect.fromX && h.lane === effect.fromLane);
    return {
      ...effect,
      ...(target >= 0 ? { x: battle.enemies[target].x, lane: battle.enemies[target].lane } : {}),
      ...(patient >= 0 ? { x: battle.heroes[patient].x, lane: battle.heroes[patient].lane } : {}),
      ...(source >= 0
        ? { fromX: battle.heroes[source].x, fromLane: battle.heroes[source].lane }
        : {}),
    };
  });
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(700, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: lindeDeliveryAssets.paper,
    });
  }
}
