import test from "node:test";
import assert from "node:assert/strict";
import * as jsx from "react/jsx-runtime";
import * as game from "../lib/game.ts";
import * as interludes from "../lib/interludes.ts";
import * as prologue from "../lib/prologue.ts";
import * as foundingAmbush from "../app/sprite-lab/storybook/founding-ambush-review.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

function trial(quest = "tower-restoration", level = 40) {
  const slots = [],
    timers = new Map();
  let cursor = 0,
    serial = 0,
    effects = [],
    tree;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!slots[i])
        slots[i] = {
          value: typeof initial === "function" ? initial() : initial,
          set(value) {
            slots[i].value = typeof value === "function" ? value(slots[i].value) : value;
          },
        };
      return [slots[i].value, slots[i].set];
    },
    useCallback: (fn) => fn,
    useEffect(fn, deps) {
      const i = cursor++,
        old = slots[i];
      if (!old || deps.some((v, j) => !Object.is(v, old.deps[j])))
        effects.push(() => {
          old?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
    },
  };
  const component = evaluateSourceModule(
    compileSourceModule(
      "../app/sprite-lab/storybook/lantern-road-phone/phone-study.tsx",
      import.meta.url,
    ),
    {
      react,
      "react/jsx-runtime": jsx,
      "@/lib/game": game,
      "@/lib/interludes": interludes,
      "@/lib/prologue": prologue,
      "../../../phone-game-frame": { PhoneFrame: "PhoneFrame" },
      "../restoration-phone/study-model": {
        studyModel: (state) => ({ state, clock: state.updatedAt }),
      },
      "../founding-ambush-review.ts": foundingAmbush,
      "../night-bridge-phone/phone-study.css": {},
    },
    {
      document: { hidden: false },
      window: {
        setInterval(fn, delay) {
          const id = ++serial;
          timers.set(id, { fn, delay });
          return id;
        },
        clearInterval(id) {
          timers.delete(id);
        },
      },
    },
  );
  const nodes = (n) => {
    if (!n || typeof n !== "object") return [];
    if (typeof n.type === "function") return [n, ...nodes(n.type(n.props))];
    return [n, ...[n.props?.children].flat(Infinity).flatMap(nodes)];
  };
  const text = (n) =>
    typeof n === "string"
      ? n
      : !n || typeof n !== "object"
        ? ""
        : [n.props?.children].flat(Infinity).map(text).join("");
  const render = () => {
    cursor = 0;
    effects = [];
    tree = component.ChapterFourPhoneStudy({ quest, level });
    effects.forEach((fn) => fn());
  };
  render();
  return {
    frame: () => nodes(tree).find((n) => n.type === "PhoneFrame").props,
    count: () => timers.size,
    click(label) {
      const button = nodes(tree).find((n) => n.type === "button" && text(n) === label);
      assert.ok(button, label);
      button.props.onClick();
      render();
    },
    tick(delay) {
      for (const timer of [...timers.values()]) if (timer.delay === delay) timer.fn();
      render();
    },
    finishBeforeAssistCleanup() {
      const clock = [...timers.values()].find((timer) => timer.delay === 100);
      const assist = [...timers.values()].find((timer) => timer.delay === 50);
      for (let i = 0; i < 3000 && slots[0].value.squads[0].run; i++) clock.fn();
      assert.equal(slots[0].value.squads[0].run, null);
      assist.fn();
      render();
    },
    restBeforeAssist() {
      const clock = [...timers.values()].find((timer) => timer.delay === 100);
      const assist = [...timers.values()].find((timer) => timer.delay === 50);
      for (let i = 0; i < 3000 && slots[0].value.squads[0].run?.phase !== "rest"; i++) clock.fn();
      assert.equal(slots[0].value.squads[0].run?.phase, "rest");
      assist.fn();
      render();
    },
  };
}

test("pausing a phone trial stops both its clock and assist timer and freezes the renderer without catching up on resume", () => {
  const h = trial();
  h.tick(100);
  assert.equal(h.frame().model.clock, 1100);
  h.click("連続手助けで確認");
  assert.equal(h.count(), 2);
  h.click("一時停止");
  assert.equal(h.frame().reviewPaused, true);
  assert.equal(h.count(), 0);
  const frozen = JSON.stringify(h.frame().model.state);
  h.tick(100);
  h.tick(50);
  assert.equal(JSON.stringify(h.frame().model.state), frozen);
  h.click("再開");
  assert.equal(h.frame().reviewPaused, false);
  assert.equal(h.count(), 2);
  h.tick(100);
  assert.equal(h.frame().model.clock, 1200);
  h.click("一時停止");
  h.click("最初から");
  assert.equal(h.frame().reviewPaused, false);
  assert.equal(h.frame().model.clock, 1000);
  assert.equal(h.count(), 1);
});

test("a queued assist tick after completion keeps the finished trial instead of throwing before effect cleanup", () => {
  const h = trial();
  h.click("連続手助けで確認");
  assert.doesNotThrow(() => h.finishBeforeAssistCleanup());
  assert.equal(h.frame().model.state.squads[0].run, null);
  assert.equal(h.count(), 1, "the clock remains but the assist interval is removed");
});

test("the founding phone can stage a live ambush while review playback remains paused", () => {
  const h = trial("starlit-guild-founding");
  h.click("一時停止");
  const target = h.frame().model.state.squads[0].run.target;
  h.click("実戦で中断");
  const run = h.frame().model.state.squads[0].run;
  assert.ok(run.enemies.some((enemy) => enemy.hp > 0));
  assert.equal(run.target, target);
  assert.equal(h.frame().reviewPaused, true);
  assert.equal(h.count(), 0);
});

test("continuous trial assistance recovers an exhausted party before attempting another strike", () => {
  const h = trial("sweet-blockade", 18);
  h.click("帰着の手前から");
  h.click("連続手助けで確認");
  assert.doesNotThrow(() => h.restBeforeAssist());
  const run = h.frame().model.state.squads[0].run;
  assert.notEqual(run.phase, "rest");
  assert.ok(Object.values(run.health).some((health) => health.hp > 0));
});

for (const quest of ["spinning-signpost", "begging-golem", "sweet-blockade"])
  test(`${quest}'s return review point keeps the last encounter active instead of completing a short quest`, () => {
    const h = trial(quest, 18);
    h.click("帰着の手前から");
    const run = h.frame().model.state.squads[0].run;
    assert.ok(run, "the review starts before completion");
    assert.equal(run.node, run.nodes - 1);
  });
