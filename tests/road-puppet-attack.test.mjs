import test from "node:test";
import assert from "node:assert/strict";
import { puppetAttackPose } from "../lib/road-puppet-attack.ts";
import { RoadStorybookEnemies } from "../lib/road-storybook-enemy.ts";

test("golem windup follows its scheduled attack and strike needs its own current encounter event", () => {
  const enemy = { id: "golem-2", role: "golem", hp: 100, nextAt: 5000 };
  const run = { round: 0, node: 1, events: [] };
  assert.equal(puppetAttackPose(enemy, run, 3999), undefined);
  assert.equal(puppetAttackPose(enemy, run, 4000), "windup");
  assert.equal(
    puppetAttackPose(enemy, run, 5001),
    undefined,
    "no invented impact when attack delayed",
  );
  run.events = [
    { id: "0-0-2", kind: "hurt", enemy: enemy.id, at: 5050 },
    { id: "0-1-3", kind: "hurt", enemy: "another-enemy", at: 5050 },
  ];
  assert.equal(puppetAttackPose(enemy, run, 5100), undefined);
  run.events.push({ id: "0-1-4", kind: "hurt", enemy: enemy.id, at: 5050 });
  assert.equal(puppetAttackPose(enemy, run, 5100), "strike");
  assert.equal(puppetAttackPose(enemy, run, 5270), undefined);
  assert.equal(puppetAttackPose({ ...enemy, hp: 0 }, run, 5100), undefined);
  assert.equal(puppetAttackPose({ ...enemy, role: "puppet" }, run, 5100), undefined);
});

test("windup and strike use registered cells at one scale and reduced motion keeps its still pose", () => {
  const motion = new RoadStorybookEnemies(),
    view = { width: 936, height: 624, stage: "forest" };
  const enemy = { id: 1, kind: "golem", hp: 100, x: 200, lane: 0.6 };
  const base = motion.pose(enemy, { time: 1000 }, view, false, "a");
  const raised = motion.pose({ ...enemy, attack: "windup" }, { time: 1100 }, view, false, "a");
  const strike = motion.pose({ ...enemy, attack: "strike" }, { time: 1200 }, view, false, "a");
  assert.equal(raised.frame, "7");
  assert.equal(strike.frame, "0");
  assert.equal(raised.height, base.height);
  assert.equal(raised.foot, base.foot);
  assert.equal(
    motion.pose({ ...enemy, attack: "windup" }, { time: 1300 }, view, true, "a").frame,
    "0",
  );
});
