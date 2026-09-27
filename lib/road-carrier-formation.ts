import { roadHasEnemies, roadWorkOffset } from "./chapter-road.ts";
import type { Quest, Run } from "./game.ts";
import type { RoadBattle } from "./road-view.ts";

type CarrierSlot = { offset: number; lane: number };

const frontPair: CarrierSlot[] = [
  { offset: 55, lane: 0.94 },
  { offset: 80, lane: 0.7 },
];
const rearPair: CarrierSlot[] = [
  { offset: -155, lane: 0.7 },
  { offset: -180, lane: 0.94 },
];
const rearTrio: CarrierSlot[] = [
  { offset: -155, lane: 0.68 },
  { offset: -180, lane: 0.82 },
  { offset: -155, lane: 0.96 },
];

export function arrangeCarriers(q: Quest, run: Run, battle: RoadBattle, front: string[]) {
  if (!front.length || roadHasEnemies(run)) return;
  // A pair shares a handle across the cart's depth; the lanes center on its wheel line.
  const paired = front.length === 2;
  const rear = battle.heroes.filter((hero) => !front.includes(hero.id));
  const frontSlots = paired ? frontPair : [{ offset: 45, lane: 0.82 }];
  const rearSlots = paired
    ? rear.length > 2
      ? rearTrio
      : rearPair
    : rear.map((_, index) => ({ offset: -145 - index * (rear.length > 2 ? 55 : 70), lane: 0.82 }));
  for (const hero of battle.heroes) {
    const frontIndex = front.indexOf(hero.id);
    const slot =
      frontIndex >= 0
        ? frontSlots[frontIndex]
        : rearSlots[rear.findIndex((member) => member.id === hero.id)];
    hero.x += slot.offset - roadWorkOffset(q, run, hero.id);
    hero.lane = slot.lane;
  }
}
