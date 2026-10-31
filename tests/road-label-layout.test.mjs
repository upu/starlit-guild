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

test("numbered ordinary wolves share a nameplate without merging named enemies or warnings", () => {
  const labels = groupRoadLabels([
    enemy(1, "霧狼 A", "slime"),
    enemy(2, "霧狼 B", "slime"),
    enemy(3, "スライム A", "slime"),
    enemy(4, "スライム B", "slime"),
    enemy(5, "飛びかかる", "slime"),
    enemy(6, "メリル A", "merrill"),
  ]);
  assert.deepEqual(
    labels.map((label) => label.text),
    ["霧狼 ×2", "スライム ×2", "飛びかかる", "メリル A"],
  );
  assert.equal(groupRoadLabels([enemy(1, "霧狼 B", "slime")])[0].text, "霧狼 B");
});

test("a tall enemy's name stays above its body when companions stand beside its feet", () => {
  const body = { x: 173, y: 65, width: 112, height: 112 };
  const hero = { x: 73, y: 122, width: 58, height: 58 };
  const nearHero = { x: 140, y: 135, width: 58, height: 58 };
  const [label] = groupRoadLabels([{ id: 2, kind: "golem", text: "運搬用ゴーレム", body }]);
  const result = new RoadLabelLayout()
    .place([{ ...label, width: 87, height: 19 }], [body, hero, nearHero], 374, 249)
    .get(label.key);
  assert.ok(result, "the name remains visible");
  assert.ok(result.y + result.height <= body.y, "the label sits above the golem");
  assert.ok(Math.abs(result.x + result.width / 2 - (body.x + body.width / 2)) < 1);
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
