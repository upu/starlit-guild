import test from "node:test";
import assert from "node:assert/strict";
import { RoadSignpostOwner } from "../lib/road-signpost-owner.ts";
import { RoadSignpostCarry } from "../lib/road-signpost-carry.ts";
import { fixedRoadLayout } from "../lib/road-fixed-layout.ts";
import { roadHeroSize, roadScale, roadDepth } from "../lib/road-layout.ts";
import { enemyDisplayHeight } from "../lib/road-enemy-layout.ts";

const scene = () => ({ poses: {}, props: [], debrisHidden: true, closeContact: false });
const battle = (time, enemies = []) => ({ time, enemies, heroes: [], effects: [] });
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);

for (const width of [374, 936]) {
  const view = { width, height: (width * 2) / 3 };
  test(`sign ownership joins departure, pickup and recovery without position jumps at ${width}`, () => {
    const owner = new RoadSignpostOwner();
    owner.enter(0, 1000, true);
    const opening = scene();
    const post = owner.paint(battle(1000), view, opening, 0);
    assert.ok(post.origin, "departure already left the sign on the puppet's back");
    assert.equal(opening.actors.length, 1);
    near(
      opening.actors[0].size * roadHeroSize(width, view.height),
      enemyDisplayHeight({ kind: "puppet", boss: false }, width, view.height),
    );
    const enemy = { id: 4, kind: "puppet", hp: 10, x: 0, lane: 0 };
    const live = battle(2000, [enemy]);
    owner.prepare(live, view);
    assert.deepEqual({ x: enemy.x, lane: enemy.lane }, opening.actors[0].point);
    const combat = scene();
    assert.deepEqual(owner.paint(live, view, combat, 0), post);
    assert.equal(combat.actors, undefined, "combat owns the same actor, without a duplicate NPC");

    owner.enter(3, 3000);
    const before = owner.paint(battle(4099), view, scene(), 0);
    const after = owner.paint(battle(4100), view, scene(), 0);
    const pixels = (p) => {
      const size = p.size * roadHeroSize(width, view.height);
      return {
        x: p.point.x * roadScale(width) - (p.origin?.x ?? 0.5) * size,
        y: p.point.lane * roadDepth(width, view.height) - (p.origin?.y ?? 1) * size * 1.25,
      };
    };
    near(pixels(before).x, pixels(after).x);
    near(pixels(before).y, pixels(after).y);
    const walk = new Set();
    for (let time = 4400; time < 5200; time += 16) {
      const s = scene();
      owner.paint(battle(time), view, s, 0);
      walk.add(s.actors[0].pose.frame);
    }
    assert.equal(walk.size, 4, "backsteps use all four travel frames");
    const stopped = owner.paint(battle(5500), view, scene(), 1);
    const carry = new RoadSignpostCarry();
    carry.start(5500);
    const falling = carry.paint({ x: 0, lane: 0 }, 5500, view, scene(), 0);
    assert.deepEqual(falling.point, stopped.point, "fall starts at the same back rope contact");
    owner.beginDeparture(5500);
    const leaving = scene();
    owner.depart(leaving, view, 5500);
    assert.deepEqual(leaving.actors[0].point, fixedRoadLayout(width, view.height).world(1130, 670));
    const gone = scene();
    owner.depart(gone, view, 6650);
    assert.equal(gone.actors, undefined);
  });
}
