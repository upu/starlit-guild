import assert from "node:assert/strict";
import { initialPrologueState, act, settle, testState } from "../lib/game.ts";
import { parseBundle } from "../lib/save-format.ts";
import { storyStages } from "../lib/prologue.ts";
import { TRADE_QUEST } from "../lib/prologue.ts";
const root = process.env.TEST_ROOT || "http://localhost:5173";
async function get(cookie = "") {
  const r = await fetch(root + "/api/backup", { headers: { cookie } });
  assert.equal(r.status, 200);
  return {
    data: await r.json(),
    cookie:
      r.headers
        .getSetCookie()
        .map((v) => v.split(";")[0])
        .join("; ") || cookie,
  };
}
const a = await get(),
  b = await get();
assert.ok(a.cookie);
assert.notEqual(a.cookie, b.cookie);
const normal = {
  id: crypto.randomUUID(),
  name: "Normal isolated API test",
  test: false,
  state: initialPrologueState(Date.now()),
};
const test = {
  id: crypto.randomUUID(),
  name: "Test isolated API test",
  test: true,
  state: testState(Date.now(), storyStages.length, 20, 20000),
};
normal.state = act(
  normal.state,
  { type: "start", id: TRADE_QUEST, readDeparture: true },
  normal.state.updatedAt,
);
let save = {
  format: 4,
  deviceId: crypto.randomUUID(),
  active: normal.id,
  profiles: [normal, test],
  serial: 2,
  sound: false,
  cloudAt: 0,
  legacyImported: true,
};
const post = (cookie, body, origin = root) =>
  fetch(root + "/api/backup", {
    method: "POST",
    headers: { cookie, origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
let r = await post(a.cookie, save);
assert.equal(r.status, 200);
assert.equal((await r.json()).changed, true);
const roundtrip = await get(a.cookie);
assert.equal(roundtrip.data.backups.length, 1);
assert.deepEqual(parseBundle(roundtrip.data.backups[0].bundle), save);
assert.equal((await get(b.cookie)).data.backups.length, 0);
r = await post(a.cookie, save);
assert.equal((await r.json()).changed, false);
const stale = structuredClone(save);
stale.serial = 1;
stale.profiles[0].state.gold = 0;
r = await post(a.cookie, stale);
assert.equal((await r.json()).changed, false);
assert.equal((await get(a.cookie)).data.backups[0].bundle.profiles[0].state.gold, 60);
const bad = structuredClone(save);
bad.serial = 3;
bad.profiles[0].state.squads[0].run.actors[0].period = 0;
assert.equal((await post(a.cookie, bad)).status, 400);
assert.equal((await post(a.cookie, save, "https://foreign.example")).status, 403);
save = structuredClone(save);
save.serial = 3;
save.profiles[0].state = settle(
  save.profiles[0].state,
  save.profiles[0].state.updatedAt + 3600000,
).state;
assert.equal((await post(a.cookie, save)).status, 200);
const latest = (await get(a.cookie)).data.backups[0].bundle;
assert.ok(latest.profiles[0].state.clears > 0);
assert.equal(latest.profiles[1].state.clears, storyStages.length);
const secondDevice = structuredClone(save);
secondDevice.deviceId = crypto.randomUUID();
secondDevice.serial = 1;
assert.equal((await post(a.cookie, secondDevice)).status, 200);
assert.equal((await get(a.cookie)).data.backups.length, 2);
// Only v4 is accepted now: an old-format upload is rejected outright.
assert.equal((await post(a.cookie, { ...save, format: 3, serial: 100000 })).status, 400);
assert.ok((await get(a.cookie)).data.backups.every((copy) => copy.bundle.format === 4));
const page = await fetch(root);
assert.equal(page.status, 200);
const html = await page.text();
assert.ok(html.includes("星灯りの旅団"));
// Pre-existing: cave.png and ruins.png moved to scenery WebP and no longer exist.
for (const asset of ["sprites.png", "camp-0.png", "camp-1.png", "camp-2.png", "favicon.svg"])
  assert.equal((await fetch(root + "/" + asset)).status, 200);
console.log(
  "PASS: anonymous backup, isolation, local snapshot roundtrip, stale/repeated writes, independent device copies, malformed input, cross-origin rejection, old format rejection, SSR and assets",
);
