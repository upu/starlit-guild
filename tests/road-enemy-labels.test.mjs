import test from "node:test";
import assert from "node:assert/strict";
import * as layout from "../lib/road-label-layout.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const { RoadEnemyLabels } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-enemy-labels.ts", import.meta.url),
  {
    "@/lib/road-label-layout": layout,
    "./road-enemy-appearance": {
      enemyLabel: (enemy, look) => look.enemies[enemy.id]?.label ?? "スライム",
      enemyArrived: () => true,
    },
  },
);

function paint(art, painted) {
  const label = {
    width: 56,
    height: 14,
    setVisible(value) {
      this.visible = value;
      return this;
    },
    setText(value) {
      this.text = value;
      return this;
    },
    setWordWrapWidth() {
      return this;
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
  };
  const image = { x: 280, y: 250, getBounds: () => ({ x: 200, y: 100, width: 160, height: 160 }) };
  new RoadEnemyLabels().paint(
    { enemies: [{ id: 1, kind: "slime", hp: 10 }], time: 1000 },
    { storybookHeroes: painted, enemies: art ? { 1: art } : {} },
    false,
    new Map(),
    new Map([[1, { image, label }]]),
    { visible: false },
    1178,
    790,
  );
  return label;
}

test("the renderer places a painted ordinary enemy's name near its head and preserves comparison art", () => {
  const art = { frame: "9", label: "山道の霧狼" };
  const before = paint(art, false),
    after = paint(art, true);
  assert.ok(after.visible && before.visible);
  assert.equal(after.text, "山道の霧狼");
  assert.ok(after.y > before.y + 70);
  assert.ok(after.y + after.height < 200);
});

test("an ordinary opponent without an authored appearance retains its fallback name", () => {
  const label = paint(undefined, true);
  assert.ok(label.visible);
  assert.equal(label.text, "スライム");
});
