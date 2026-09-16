import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import * as equipment from "../lib/equipment.ts";
import * as journey from "../lib/journey.ts";
import * as externalInput from "../lib/external-input.ts";
import { initialPrologueState } from "../lib/game.ts";
import { prologueStages, TOWN_QUEST } from "../lib/prologue.ts";

function source(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
}
const hookCode = source("../app/use-journey-hints.ts"),
  entryCode = source("../app/shop-entry.tsx");
function harness(data = new Map(), denyStorage = false) {
  const hook = {},
    entry = {};
  let opened = 0;
  const modules = {
    react: { useCallback: (fn) => fn, useSyncExternalStore: (_subscribe, snapshot) => snapshot() },
    "react/jsx-runtime": jsx,
    "next/image": { default: "img" },
    "@/lib/journey": journey,
    "@/lib/external-input": externalInput,
    "@/lib/equipment": equipment,
    "./use-journey-hints": hook,
  };
  const context = {
    require: (id) => {
      assert.ok(id in modules, id);
      return modules[id];
    },
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        if (denyStorage) throw Error("unavailable");
        data.set(key, value);
      },
    },
    window: { dispatchEvent: () => {} },
    Event,
  };
  vm.runInNewContext(hookCode, { ...context, exports: hook });
  vm.runInNewContext(entryCode, { ...context, exports: entry });
  return {
    data,
    opened: () => opened,
    render: (state, obscured = false, profileId = "adventure-a") =>
      entry.ShopEntry({ state, obscured, profileId, onOpen: () => opened++ }),
  };
}
function progress(count) {
  const s = initialPrologueState(1000);
  for (const stage of prologueStages.slice(0, count)) {
    s.done[stage.quest] = 1;
    s.story.departed.push(stage.quest);
    s.story.completed.push(stage.quest);
    s.story.read.push(stage.quest + "-return");
  }
  return s;
}
function find(node, predicate) {
  if (!node || typeof node !== "object") return;
  return predicate(node)
    ? node
    : [node.props?.children]
        .flat()
        .map((child) => find(child, predicate))
        .find(Boolean);
}
const tip = (node) => find(node, (n) => n.props?.role === "status");
const button = (node) => find(node, (n) => n.type === "button");

test("shop image and announcement appear only after reading the 1-3 ending", () => {
  const h = harness(),
    pending = progress(3);
  pending.story.read = pending.story.read.filter((id) => id !== TOWN_QUEST + "-return");
  assert.equal(h.render(progress(2)), null);
  assert.equal(h.render(pending), null);
  const node = h.render(progress(3));
  assert.ok(tip(node));
  assert.equal(button(node).props["aria-describedby"], tip(node).props.id);
  assert.equal(find(node, (n) => n.type === "img").props.src, "/ui/shop-stall.png");
  assert.equal(h.data.size, 0);
});
test("dialogues and result sheets temporarily hide the announcement without acknowledging it", () => {
  const h = harness(),
    s = progress(3);
  assert.equal(tip(h.render(s, true)), undefined);
  assert.ok(button(h.render(s, true)));
  assert.ok(tip(h.render(s)));
  assert.equal(h.data.size, 0);
});
test("opening the shop acknowledges it across reloads, separately for each adventure, without mutating saves", () => {
  const h = harness(),
    s = progress(3),
    before = structuredClone(s);
  button(h.render(s)).props.onClick();
  assert.equal(h.opened(), 1);
  assert.equal(tip(h.render(s)), undefined);
  const reloaded = harness(h.data);
  assert.equal(tip(reloaded.render(s)), undefined);
  assert.ok(tip(reloaded.render(s, false, "adventure-b")));
  assert.equal(tip(reloaded.render(s, false, "")), undefined);
  assert.deepEqual(s, before);
  assert.equal(h.data.size, 1);
  assert.ok(h.data.has("starlit-journey-hints-v1:adventure-a"));
});
test("blocked device storage still allows shopping and dismisses the announcement for the session", () => {
  const h = harness(new Map(), true),
    s = progress(3);
  button(h.render(s)).props.onClick();
  assert.equal(h.opened(), 1);
  assert.equal(tip(h.render(s)), undefined);
  assert.equal(h.data.size, 0);
});
