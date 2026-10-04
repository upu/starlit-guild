import test from "node:test";
import assert from "node:assert/strict";
import { workStudy, workStudyPose, workPhase } from "../lib/home-work-study.ts";
import { residentIds, residentAnimation, residentAtlas, workFrame } from "../lib/home-actor.ts";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { residentDisplayPosition } from "../lib/home-room-presentation.ts";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
test("hands work over the bench with continuous arms and planted feet", () => {
  const rest = workStudyPose(0);
  for (let t = 0; t < workStudy.duration; t += 5) {
    const p = workStudyPose(t, true);
    assert.ok(Math.abs(distance(p.shoulder, p.elbow) - 21) < 1e-8, "upper arm length");
    assert.ok(Math.abs(distance(p.elbow, p.hand) - 23) < 1e-8, "forearm length");
    assert.ok(
      p.hand.x >= 130 && p.hand.x <= 141 && p.hand.y >= 85 && p.hand.y <= 92,
      "working hand stays close to the tabletop",
    );
    assert.ok(distance(p.hand, p.support) >= 8, "hands remain distinct");
    assert.deepEqual(p.feet, rest.feet, "feet stay planted");
    assert.deepEqual(p.support, rest.support, "second hand holds the work steadily");
  }
});

test("work guide and residents share four poses without mirroring or save changes", () => {
  for (const id of residentIds)
    for (let i = 0; i < 4; i++) {
      const time = i * workStudy.step;
      assert.equal(residentAnimation("craft", time, 0, false).frame, i);
      assert.equal(workFrame(time), i);
      assert.equal(workFrame(time, true), 0);
      for (const left of [false, true])
        assert.deepEqual(residentAtlas(id, "craft", i, true, left), {
          name: `${id}-work`,
          frame: i,
          flip: false,
        });
    }
  assert.equal(workFrame(-1), 3);
  assert.equal(workFrame(workStudy.duration), 0);
});

test("work placement keeps hands toward the tabletop without moving saved approach positions", () => {
  const furniture = [{ id: "bench", kind: "bench", x: 5, y: 4 }];
  for (const id of residentIds) {
    const resident = { id, pose: "craft", furniture: "bench", x: 156, y: 156 };
    const position = residentDisplayPosition(resident, furniture);
    assert.equal(position.y, 148);
    assert.equal(position.x, id === "lico" ? 164 : 148);
    assert.deepEqual({ x: resident.x, y: resident.y }, { x: 156, y: 156 });
    assert.deepEqual(residentDisplayPosition({ ...resident, pose: "walk" }, furniture), {
      x: 156,
      y: 156,
    });
  }
});

test("authored work poses use one scale, planted soles and distinct transparent frames", async () => {
  const anchors = JSON.parse(readFileSync("public/home-pixel/anchors.json", "utf8"));
  for (const id of residentIds) {
    const frames = anchors[`${id}-work`];
    assert.equal(new Set(frames.map((f) => f.scale)).size, 1, "do not enlarge the bowed pose");
    assert.ok(
      frames.every((f) => f.top + f.height === 120),
      "soles stay on the floor",
    );
    const source = sharp(`assets/source/home-pixel/${id}-work-v1.png`),
      meta = await source.metadata();
    assert.equal(meta.width, 1536);
    assert.equal(meta.height, 1024);
    assert.equal(meta.hasAlpha, true);
    const { data } = await source.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let y = 0; y < 1024; y++)
      assert.ok(data[(y * 1536 + 768) * 4 + 3] < 96, `${id}: clear center gutter`);
    for (let x = 0; x < 1536; x++)
      assert.ok(data[(512 * 1536 + x) * 4 + 3] < 96, `${id}: clear row gutter`);
    const atlas = sharp(`public/home-pixel/${id}-work.webp`),
      pixels = [];
    for (let i = 0; i < 4; i++)
      pixels.push(
        await atlas
          .clone()
          .extract({ left: i * 128, top: 0, width: 128, height: 128 })
          .raw()
          .toBuffer(),
      );
    for (let i = 0; i < 4; i++)
      assert.ok(!pixels[i].equals(pixels[(i + 1) % 4]), `${id}: changing work pose`);
  }
});
test("four-pose reference and interpolated loop share their key poses and wrap continuously", () => {
  assert.equal(Math.floor(workPhase(-1)), 3);
  for (let i = 0; i < 4; i++) {
    assert.equal(workStudyPose(i * 400).frame, i);
    assert.deepEqual(workStudyPose(i * 400), workStudyPose(i * 400, true));
    assert.deepEqual(workStudyPose(i * 400), workStudyPose(i * 400 + 399));
  }
  assert.deepEqual(workStudyPose(0), workStudyPose(workStudy.duration));
  for (let t = 0; t < workStudy.duration; t += 5) {
    assert.ok(distance(workStudyPose(t, true).hand, workStudyPose(t + 5, true).hand) < 1);
  }
  assert.ok(workStudyPose(800).lean > workStudyPose(0).lean, "upper body follows the hands");
});
test("paperwork reuses all four work frames with authored handedness and desk placement", () => {
  for (const id of residentIds)
    for (let frame = 0; frame < 4; frame++) {
      assert.equal(residentAnimation("paper", frame * 400, 0, false).frame, frame);
      assert.deepEqual(
        residentAtlas(id, "paper", frame, true, true),
        residentAtlas(id, "craft", frame, true, true),
      );
      const resident = { id, pose: "paper", furniture: "desk", x: 168, y: 132 };
      assert.deepEqual(
        residentDisplayPosition(resident, [{ id: "desk", kind: "desk", x: 6, y: 3 }]),
        { x: id === "lico" ? 176 : 160, y: 124 },
      );
    }
});
