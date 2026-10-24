import { test } from "node:test";
import assert from "node:assert/strict";
import { groupRoadLabels, RoadLabelLayout, roadRectsOverlap } from "../lib/road-label-layout.ts";

const enemy = (id, text = "コロタケ", kind = "mushroom") => ({
  id,
  text,
  kind,
  body: { x: 220 + id * 9, y: 400 + id * 8, width: 30, height: 35 },
});
test("repeated enemies share a count, while a named opponent and different action cues stay distinct", () => {
  const members = [1, 2, 3, 4].map((id) => enemy(id));
  const labels = groupRoadLabels([
    ...members,
    enemy(5, "メリル", "merrill"),
    enemy(6, "歌い始める", "merrill"),
  ]);
  assert.deepEqual(
    labels.map((l) => l.text),
    ["コロタケ ×4", "メリル", "歌い始める"],
  );
  assert.equal(groupRoadLabels(members.slice(1))[0].text, "コロタケ ×3");
  assert.equal(groupRoadLabels(members.slice(3))[0].text, "コロタケ");
  assert.equal(groupRoadLabels([enemy(1, "")]).length, 0);
});

test("names stay inside the viewport and outside figures, HP bars, props and other names", () => {
  for (const [width, height] of [
    [320, 210],
    [388, 740],
    [1178, 848],
  ]) {
    const base = height * 0.62;
    const bodies = [0.25, 0.4, 0.5, 0.65, 0.75].map((p, i) => ({
      x: width * p - 25,
      y: base - 65 + i * 6,
      width: 50,
      height: 80,
    }));
    const labels = bodies.slice(2).map((body, i) => ({
      key: String(i),
      owner: i,
      text: "enemy",
      anchor: { x: body.x + 25, y: body.y + 84 },
      width: 88,
      height: 20,
    }));
    const layout = new RoadLabelLayout();
    const result = layout.place(labels, bodies, width, height);
    assert.equal(result.size, labels.length);
    const placed = [...result.values()];
    for (const [i, rect] of placed.entries()) {
      assert.ok(
        rect.x >= 4 &&
          rect.y >= 4 &&
          rect.x + rect.width <= width - 4 &&
          rect.y + rect.height <= height - 4,
      );
      assert.ok([...bodies, ...placed.slice(i + 1)].every((b) => !roadRectsOverlap(rect, b)));
    }
    assert.deepEqual(
      layout.place(labels, bodies, width, height),
      result,
      "static frames do not jitter",
    );
    const dx = 1,
      dy = -1;
    const moved = layout.place(
      labels.map((l) => ({ ...l, anchor: { x: l.anchor.x + dx, y: l.anchor.y + dy } })),
      bodies.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy })),
      width,
      height,
    );
    for (const [key, rect] of moved) {
      assert.ok(Math.abs(rect.x - result.get(key).x) <= 1.01);
      assert.ok(Math.abs(rect.y - result.get(key).y) <= 1.01);
    }
    const resized = layout.place(labels, bodies, 320, height);
    for (const rect of resized.values()) assert.ok(rect.x + rect.width <= 316);
  }
});
