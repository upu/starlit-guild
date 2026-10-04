import test from "node:test";
import assert from "node:assert/strict";
import { gardenPose, gardenPhase, gardenStudy } from "../lib/home-garden-study.ts";
import { residentIds, residentAnimation, residentAtlas, gardenFrame } from "../lib/home-actor.ts";
import { gardenSpouts, gardenWater } from "../lib/home-garden-water.ts";
import { HomeLife } from "../lib/home-room-life.ts";
import { residentDisplayPosition } from "../lib/home-room-presentation.ts";
import { roomFurniture, furnitureSpots, cellPoint, layoutError } from "../lib/home-room-layout.ts";
import { readFileSync } from "node:fs";
import sharp from "sharp";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
test("garden arms remain connected and soles stay planted throughout the watering cycle", () => {
  const rest = gardenPose(0);
  for (let time = 0; time < gardenStudy.duration; time += 5) {
    const p = gardenPose(time, true);
    assert.ok(Math.abs(distance(p.shoulder, p.elbow) - 24) < 1e-8);
    assert.ok(Math.abs(distance(p.elbow, p.hand) - 25) < 1e-8);
    assert.deepEqual(p.feet, rest.feet);
    assert.ok(p.elbow.y > p.shoulder.y, "elbow bends down, never behind the head");
    assert.ok(p.hand.x < 144, "hand stays beside the leaves, not inside the planter");
  }
  const last = gardenPose(gardenStudy.duration - 0.001, true);
  assert.ok(distance(rest.hand, last.hand) < 0.001);
  assert.ok(Math.abs(rest.lean - last.lean) < 0.001);
});
test("water comes from the tilted spout above the roots, never from an upright can", () => {
  for (let time = 0; time < gardenStudy.duration; time += 5) {
    const p = gardenPose(time, true);
    if (p.pouring) {
      assert.ok(p.tilt >= 12);
      assert.ok(p.spout.x > 145 && p.spout.x < 165);
      assert.ok(p.spout.y > 100 && p.spout.y < 132);
    }
  }
  assert.equal(gardenPose(1200).pouring, true);
  assert.equal(gardenPose(1800).pouring, false);
  assert.equal(gardenPhase(-600), 3);
  assert.equal(gardenPhase(2400), 0);
});
test("all residents use the four watering poses without mirroring, freezing both frames and water", () => {
  for (const id of residentIds)
    for (let frame = 0; frame < 4; frame++) {
      const time = frame * 600;
      const pose = residentAnimation("garden", time, 0, false);
      assert.equal(pose.frame, frame);
      for (const left of [false, true])
        assert.deepEqual(residentAtlas(id, "garden", frame, pose.action, left), {
          name: `${id}-garden`,
          frame,
          flip: false,
        });
      assert.equal(gardenWater(id, time).length, frame === 2 ? 3 : 0);
      assert.equal(gardenWater(id, time, true).length, 0);
      assert.equal(residentAnimation("garden", time, 0, true).frame, 0);
      assert.equal(gardenFrame(time), Math.floor(gardenPhase(time)));
    }
});
test("garden approach follows authored hand without crossing crops; legacy right-only plots still load", () => {
  for (const site of ["linde", "brekka"])
    for (const id of residentIds) {
      const furniture = roomFurniture(site),
        life = new HomeLife();
      life.sync([id], furniture, "garden", false);
      const r = life.residents[0],
        plot = furniture.find((f) => f.id === r.furniture);
      assert.equal(r.pose, "garden");
      assert.deepEqual({ x: r.x, y: r.y }, cellPoint(furnitureSpots(plot)[id === "lico" ? 0 : 1]));
      assert.equal(r.left, id === "lico");
      const display = residentDisplayPosition(r, furniture);
      for (let t = 1200; t < 1800; t += 30)
        for (const drop of gardenWater(id, t)) {
          const x = display.x + drop.x,
            y = display.y + drop.y;
          assert.ok(x > plot.x * 24 + 3 && x < (plot.x + 4) * 24 - 3);
          assert.ok(y < (plot.y + 2) * 24 - 21, "water stays above the front board");
        }
      life.sync(
        [id],
        roomFurniture(site).map((f) => ({ ...f, y: f.y - 1 })),
        "garden",
        false,
      );
      for (let i = 0; i < 800; i++)
        life.tick(
          33,
          roomFurniture(site).map((f) => ({ ...f, y: f.y - 1 })),
          false,
        );
      assert.equal(life.residents[0].pose, "garden");
    }
  assert.equal(layoutError([{ id: "legacy", kind: "plot", x: 0, y: 5 }], true), null);
});
test("watering originals remain transparent with planted soles and measured spouts", async () => {
  const anchors = JSON.parse(readFileSync("public/home-pixel/anchors.json", "utf8"));
  const record = JSON.parse(readFileSync("docs/art-generation/home-pixel-garden.json", "utf8"));
  for (const id of residentIds) {
    const source = sharp(`assets/source/home-pixel/${id}-garden-v1.png`),
      meta = await source.metadata();
    assert.equal(meta.width, 1536);
    assert.equal(meta.height, 1024);
    assert.equal(meta.hasAlpha, true);
    const frames = anchors[`${id}-garden`];
    assert.equal(new Set(frames.map((f) => f.scale)).size, 1);
    assert.ok(frames.every((f) => f.top + f.height === 120));
    const a = frames[2],
      tip = gardenSpouts[id];
    assert.ok(
      Math.abs(tip.x - ((tip.source[0] - a.source.left) * a.scale + a.left - 64) / 2) < 1e-9,
    );
    assert.ok(
      Math.abs(tip.y - ((tip.source[1] - a.source.top) * a.scale + a.top - 120) / 2) < 1e-9,
    );
    const pixels = await source.ensureAlpha().raw().toBuffer();
    assert.ok(
      pixels[((512 + tip.source[1]) * 1536 + tip.source[0]) * 4 + 3] > 96,
      "spout is on the authored opaque art",
    );
    for (let y = 0; y < 1024; y++)
      assert.ok(pixels[(y * 1536 + 768) * 4 + 3] < 96, "clear cell gutter");
    for (let x = 0; x < 1536; x++)
      assert.ok(pixels[(512 * 1536 + x) * 4 + 3] < 96, "clear row gutter");
    assert.equal(record.calls.filter((c) => c.id === id && c.accepted).length, 1);
  }
});
