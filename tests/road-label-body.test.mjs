import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  roadLabelBody,
  groupRoadLabels,
  RoadLabelLayout,
  roadRectsOverlap,
  roadLabelWrapWidth,
} from "../lib/road-label-layout.ts";

for (const [kind, name, cell, frames, artFrame] of [
  ["golem", "golem-poses-v1", 512, 8],
  ["puppet", "puppet-poses-v1", 512, 8],
  ["pumpety", "masked-pumpety-v1", 128, 8],
  ["slime", "wolf-v1", 1024, 1, "9"],
  ["slime", "slime-road-v1", 1024, 1, "8"],
])
  test(`${name}'s label obstacle covers the visible pixels in both facings without the atlas gutter`, async () => {
    const atlas = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const body = roadLabelBody({ x: 0, y: 0, width: cell, height: cell }, kind, true, artFrame);
    assert.ok(body.height < cell && body.width < cell);
    for (let frame = 0; frame < frames; frame++)
      for (let y = 0; y < cell; y++)
        for (let x = 0; x < cell; x++) {
          const px = (frame % 4) * cell + x,
            py = Math.floor(frame / 4) * cell + y;
          if (atlas.data[(py * atlas.info.width + px) * 4 + 3] <= 16) continue;
          for (const facingX of [x, cell - 1 - x])
            assert.ok(
              facingX >= body.x &&
                facingX < body.x + body.width &&
                y >= body.y &&
                y < body.y + body.height,
              `frame ${frame} at ${x},${y}`,
            );
        }
  });

test("the masked girl's long name stays beside her above the table rather than above the golem's transparent gutter", () => {
  const enemies = [
    {
      id: 1,
      kind: "golem",
      text: "運搬用ゴーレム",
      body: { x: 183, y: 324, width: 118, height: 118 },
    },
    {
      id: 2,
      kind: "pumpety",
      text: "カボチャ頭の少女",
      body: { x: 325, y: 378, width: 57, height: 57 },
    },
  ];
  const place = (painted) => {
    const figures = enemies.map((enemy) => ({
      ...enemy,
      body: roadLabelBody(enemy.body, enemy.kind, painted),
    }));
    const labels = groupRoadLabels(figures).map((label) => {
      const naturalWidth = label.owner === 2 ? 96 : 88;
      const width = painted
        ? Math.min(naturalWidth, roadLabelWrapWidth(label.anchor.x, 390))
        : naturalWidth;
      return { ...label, width, height: width < naturalWidth ? 28 : 14 };
    });
    const props = [{ x: 285, y: 425, width: 84, height: 48 }];
    const positions = new RoadLabelLayout().place(
      labels,
      [...figures.map((e) => e.body), ...props],
      390,
      740,
    );
    return {
      rect: positions.get("pumpety:カボチャ頭の少女"),
      bodies: figures.map((e) => e.body),
      props,
    };
  };
  const before = place(false),
    after = place(true);
  assert.ok(after.rect.y > before.rect.y + 40, "the name moves down toward its owner");
  assert.ok(after.rect.y + after.rect.height <= after.bodies[1].y);
  assert.ok(after.bodies[1].y - after.rect.y - after.rect.height < 10);
  assert.ok(after.rect.x >= 4 && after.rect.x + after.rect.width <= 386);
  assert.ok([...after.bodies, ...after.props].every((body) => !roadRectsOverlap(after.rect, body)));
});

test("unconverted ordinary art and the comparison renderer retain their original bounds", () => {
  const body = { x: 21, y: 34, width: 56, height: 78 };
  assert.equal(roadLabelBody(body, "golem"), body);
  assert.equal(roadLabelBody(body, "slime"), body);
  assert.equal(roadLabelBody(body, "slime", true, "11"), body);
});

test("a wolf's name is anchored above its painted head rather than the empty square", () => {
  for (const size of [80, 160]) {
    const original = { x: 200, y: 100, width: size, height: size };
    const body = roadLabelBody(original, "slime", true, "9");
    const [label] = groupRoadLabels([{ id: 1, kind: "slime", text: "霧狼 A", body }]);
    const rect = new RoadLabelLayout()
      .place([{ ...label, width: 72, height: 14 }], [body], 1178, 790)
      .get(label.key);
    assert.ok(rect);
    assert.ok(rect.y > original.y + size * 0.25);
    assert.ok(body.y - rect.y - rect.height >= 0);
    assert.ok(body.y - rect.y - rect.height < 10);
    assert.ok(!roadRectsOverlap(rect, body));
  }
});
