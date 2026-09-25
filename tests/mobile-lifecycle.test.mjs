import * as chapterPresets from "../lib/test-presets.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as game from "../lib/game.ts";
import * as format from "../lib/save-format.ts";
import * as journey from "../lib/journey.ts";
import * as backupApi from "../lib/backup-api.ts";
import * as apiInput from "../lib/api-input.ts";
import * as externalInput from "../lib/external-input.ts";
import * as localIds from "../lib/local-id.ts";

function compile(relativePath) {
  return ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
const code = compile("../app/use-local-game.ts"),
  stateCode = compile("../app/local-game-state.ts"),
  lifecycleCode = compile("../app/local-game-lifecycle.ts"),
  actionsCode = compile("../app/local-game-actions.ts");
function harness(testToolsEnabled, initialBundle) {
  let now = 1000,
    writes = 0,
    requests = 0;
  const data = new Map(),
    timers = [],
    initializers = [],
    effects = [],
    docEvents = new Map(),
    winEvents = new Map();
  const exports = {};
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      writes++;
      data.set(key, value);
    },
    removeItem: (key) => data.delete(key),
  };
  const doc = {
    visibilityState: "visible",
    addEventListener: (k, v) => docEvents.set(k, v),
    removeEventListener: (k) => docEvents.delete(k),
  };
  const modules = {
    react: {
      useState: (v) => [v, () => {}],
      useRef: (v) => ({ current: v }),
      useCallback: (fn) => fn,
      useEffect: (fn) => effects.push(fn),
    },
    sonner: { toast: { success: () => {}, error: () => {}, info: () => {} } },
    "@/lib/game": game,
    "@/lib/save-format": format,
    "@/lib/journey": journey,
    "@/lib/backup-api": backupApi,
    "@/lib/api-input": apiInput,
    "@/lib/test-presets": chapterPresets,
    "@/lib/external-input": externalInput,
    "@/lib/local-id": localIds,
    "@/lib/sound": {
      setSound: () => {},
      sound: () => {},
      soundEvents: () => {},
      unlockSound: () => {},
    },
  };
  const context = {
    require: (id) => {
      if (!(id in modules)) throw Error(id);
      return modules[id];
    },
    structuredClone,
    crypto,
    AbortSignal,
    Date: class extends Date {
      static now() {
        return now;
      }
    },
    localStorage: storage,
    document: doc,
    window: {
      addEventListener: (k, v) => winEvents.set(k, v),
      removeEventListener: (k) => winEvents.delete(k),
    },
    setTimeout: (fn) => {
      initializers.push(fn);
      return initializers.length;
    },
    clearTimeout: () => {},
    setInterval: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length;
    },
    clearInterval: () => {},
    fetch: () => {
      requests++;
      return new Promise(() => {});
    },
  };
  const evaluate = (source) => {
    const moduleExports = {};
    vm.runInNewContext(source, { ...context, exports: moduleExports });
    return moduleExports;
  };
  modules["./local-game-state"] = evaluate(stateCode);
  modules["./local-game-lifecycle"] = evaluate(lifecycleCode);
  modules["./local-game-actions"] = evaluate(actionsCode);
  Object.assign(exports, evaluate(code));
  if (initialBundle) data.set(exports.SAVE_KEY, JSON.stringify(initialBundle));
  const hook = exports.useLocalGame(testToolsEnabled);
  effects.forEach((fn) => fn());
  initializers.forEach((fn) => fn());
  const key = exports.SAVE_KEY;
  return {
    hook,
    key,
    data,
    timers,
    read: () => JSON.parse(data.get(key)),
    writes: () => writes,
    requests: () => requests,
    setNow: (value) => {
      now = value;
    },
    visibility: (value) => {
      doc.visibilityState = value;
      docEvents.get("visibilitychange")();
    },
    pagehide: () => winEvents.get("pagehide")(),
  };
}

test("test tools default off and cannot create a test profile through the hook", () => {
  for (const enabled of [undefined, false]) {
    const h = harness(enabled),
      before = h.data.get(h.key),
      writes = h.writes();
    h.hook.createProfile(true);
    assert.equal(h.data.get(h.key), before);
    assert.equal(h.writes(), writes);
    h.hook.createProfile();
    assert.equal(h.read().profiles.length, 2);
    assert.ok(h.read().profiles.every((p) => !p.test));
  }
});
test("enabled test tools adjust only the test profile and preserve the ordinary adventure", () => {
  const h = harness(true),
    ordinary = h.read().profiles[0];
  h.hook.adjust(20, 8, 5000);
  assert.deepEqual(h.read().profiles[0], ordinary);
  h.hook.createProfile(true);
  h.hook.adjust(20, 8, 5000);
  const b = h.read(),
    p = b.profiles.find((p) => p.id === b.active);
  assert.equal(p.test, true);
  assert.equal(p.state.gold, 5000);
  assert.equal(p.state.clears, 20);
  assert.deepEqual(b.profiles[0], ordinary);
});

test("chapter presets create separate records, respect the capability and capacity, and reload", () => {
  const disabled = harness(false),
    unchanged = disabled.data.get(disabled.key);
  disabled.hook.createProfile(true, "chapter-3");
  disabled.hook.createProfile(false, "strong-start");
  assert.equal(disabled.data.get(disabled.key), unchanged);
  const h = harness(true),
    ordinary = h.read().profiles[0];
  for (const preset of chapterPresets.testPresets) h.hook.createProfile(true, preset.id);
  const bundle = h.read();
  assert.equal(bundle.profiles.length, 5);
  assert.deepEqual(bundle.profiles[0], ordinary);
  for (const p of bundle.profiles.slice(1)) {
    assert.equal(p.test, true);
  }
  assert.deepEqual(harness(true, bundle).read().profiles, bundle.profiles);
  h.hook.switchProfile(ordinary.id);
  assert.deepEqual(h.read().profiles[0], ordinary);
  for (let i = 0; i < 12; i++) h.hook.createProfile(true, "chapter-3");
  assert.equal(h.read().profiles.length, 12);
});
test("disabling tools preserves saved and restored test profiles without permitting adjustments", async () => {
  const enabled = harness(true);
  enabled.hook.createProfile(true);
  enabled.hook.adjust(20, 8, 5000);
  const initial = enabled.read(),
    h = harness(false, initial),
    before = h.data.get(h.key);
  h.hook.adjust(60, 20, 20000);
  h.hook.createProfile(true);
  assert.equal(h.data.get(h.key), before);
  assert.deepEqual(h.read().profiles, initial.profiles);
  h.hook.restoreCopy(initial.profiles[1]);
  const restored = h.data.get(h.key);
  h.hook.adjust(60, 20, 20000);
  assert.equal(h.data.get(h.key), restored);
  await h.hook.importFile({ size: 100, text: async () => JSON.stringify(initial) });
  const imported = h.data.get(h.key);
  h.hook.adjust(60, 20, 20000);
  assert.equal(h.data.get(h.key), imported);
  assert.equal(h.read().profiles.length, 4);
});

test("deleting records preserves at least one and switches away from a deleted active record", () => {
  const h = harness(),
    first = h.read().active;
  h.hook.createProfile();
  const second = h.read().active;
  assert.equal(h.hook.deleteProfile(first), true);
  assert.equal(h.read().active, second);
  assert.equal(h.read().profiles.length, 1);
  const saved = h.data.get(h.key);
  assert.equal(h.hook.deleteProfile(second), false);
  assert.equal(h.data.get(h.key), saved);
});

test("deleting a record from a full device makes room for a file import", async () => {
  const h = harness();
  for (let i = 1; i < 12; i++) h.hook.createProfile();
  const full = h.read(),
    deleted = full.active;
  await assert.rejects(
    h.hook.importFile({ size: 100, text: async () => JSON.stringify(full) }),
    /不要な記録を削除/,
  );
  assert.equal(h.hook.deleteProfile(deleted), true);
  assert.equal(h.read().profiles.length, 11);
  assert.notEqual(h.read().active, deleted);
  await h.hook.importFile({ size: 100, text: async () => JSON.stringify(full) });
  const restored = h.read();
  assert.equal(restored.profiles.length, 12);
  assert.notEqual(restored.active, deleted);
  assert.match(restored.profiles.find((p) => p.id === restored.active).name, /（復元）$/);
});

test("hidden game stops periodic writes, simulation and cloud requests", () => {
  const h = harness();
  h.hook.dispatch({ type: "start", id: "village-trade" });
  h.setNow(2000);
  h.visibility("hidden");
  const writes = h.writes(),
    requests = h.requests(),
    save = h.data.get(h.key);
  h.setNow(400000);
  h.timers.forEach((t) => t.fn());
  assert.equal(h.writes(), writes);
  assert.equal(h.requests(), requests);
  assert.equal(h.data.get(h.key), save);
});
test("resuming after another tab expires reloads its latest save before writing", () => {
  const h = harness();
  h.visibility("hidden");
  const newer = h.read();
  newer.serial += 100;
  newer.profiles[0].state.gold = 54321;
  newer.profiles[0].name = "別のタブで進めた冒険";
  h.data.set(h.key, JSON.stringify(newer));
  h.data.set(h.key + "-tab", JSON.stringify({ id: "another-tab", until: 9000 }));
  h.setNow(10000);
  h.visibility("visible");
  const resumed = h.read();
  assert.equal(resumed.profiles[0].state.gold, 54321);
  assert.equal(resumed.profiles[0].name, "別のタブで進めた冒険");
  assert.ok(resumed.serial > newer.serial);
});
test("a still active other tab prevents writes both on resume and pagehide", () => {
  const h = harness();
  h.visibility("hidden");
  h.data.set(h.key + "-tab", JSON.stringify({ id: "another-tab", until: 999999 }));
  const saved = h.data.get(h.key),
    writes = h.writes();
  h.setNow(5000);
  h.visibility("visible");
  h.pagehide();
  assert.equal(h.writes(), writes);
  assert.equal(h.data.get(h.key), saved);
  assert.equal(h.hook.dispatch({ type: "start", id: "village-trade" }), false);
});
test("returning from a screen lock settles earned progress once", () => {
  const h = harness();
  h.hook.dispatch({ type: "start", id: "village-trade" });
  h.visibility("hidden");
  h.setNow(3601000);
  h.visibility("visible");
  const first = h.read();
  assert.ok(first.profiles[0].state.clears > 0);
  h.visibility("visible");
  const second = h.read();
  assert.equal(second.profiles[0].state.gold, first.profiles[0].state.gold);
  assert.equal(second.profiles[0].state.clears, first.profiles[0].state.clears);
});
