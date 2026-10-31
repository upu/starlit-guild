import test from "node:test";
import assert from "node:assert/strict";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import * as handheld from "../lib/road-handheld.ts";
import * as layout from "../lib/road-layout.ts";
const { RoadNightLights } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-night-lights.ts", import.meta.url),
  {
    "@/lib/road-handheld": handheld,
    "@/lib/road-layout": layout,
  },
);

for (const [width, height] of [
  [374, 249],
  [936, 624],
])
  test(`night light follows the rendered jar and stays on the floor at ${width}px`, () => {
    const ellipses = [],
      lamp = { texture: { getSourceImage: () => ({ width: 128, height: 256 }) } };
    for (const method of ["setOrigin", "setDepth", "setFlipX"]) lamp[method] = () => lamp;
    lamp.setDisplaySize = (w, h) => {
      lamp.width = w;
      lamp.height = h;
      return lamp;
    };
    lamp.setPosition = (x, y) => {
      lamp.x = x;
      lamp.y = y;
      return lamp;
    };
    lamp.setVisible = (value) => {
      lamp.visible = value;
      return lamp;
    };
    const light = {
      setDepth: () => light,
      clear: () => {
        ellipses.length = 0;
        return light;
      },
      fillStyle(color) {
        this.color = color;
        return this;
      },
      fillEllipse(x, y, w, h) {
        ellipses.push({ x, y, w, h, color: this.color });
        return this;
      },
    };
    const effect = new RoadNightLights({
        scale: { width, height },
        add: { image: () => lamp, graphics: () => light },
      }),
      look = { storybookHeroes: true, quest: "moss-night-road" },
      state = {
        time: 1000,
        distance: 50,
        stage: "forest",
        heroes: [
          { id: "aria", x: 70, lane: 0.7, facing: 1 },
          { id: "leon", x: 140, lane: 0.9, facing: 1 },
        ],
        handheld: [{ kind: "moss-jar", phase: "held" }],
      };
    const point = { x: 83, lane: 0.3 };
    effect.paint(state, look, true, point);
    const foot = layout.roadY(0.9, height, width),
      figure = (layout.roadHeroSize(width, height) * 0.9) / 144,
      amber = ellipses.filter((e) => e.color === 0xffc57a);
    assert.equal(lamp.y, foot - 82 * figure, "the hook hangs from Leon's bag at the waist");
    assert.ok(lamp.y + lamp.height < foot - 20 * figure, "the lantern clears the boots");
    assert.ok(
      amber.every((e) => e.y === lamp.y + lamp.height / 2),
      "the glow follows the lantern",
    );
    const green = ellipses.filter((e) => e.color === 0xd8f6a2),
      pool = green.filter((e) => e.w > e.h);
    assert.ok(green.every((e) => e.x === layout.roadX(point.x, state.distance, width, "forest")));
    assert.ok(
      pool.every((e) => e.y === layout.roadY(0.7, height, width)),
      "carried light reaches ground at feet, not waist",
    );
    state.handheld[0].phase = "ground";
    effect.paint(state, look, true, point);
    assert.ok(
      ellipses
        .filter((e) => e.color === 0xd8f6a2 && e.w > e.h)
        .every((e) => e.y === layout.roadY(point.lane, height, width)),
    );
    effect.paint(state, { ...look, quest: "tower-road" }, true, point);
    assert.equal(lamp.visible, false);
    assert.equal(ellipses.length, 0, "light must not leak into the next daytime scene");
  });
