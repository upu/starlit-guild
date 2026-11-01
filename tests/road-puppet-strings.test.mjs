import test from "node:test";
import assert from "node:assert/strict";
import { puppetStringContacts } from "../lib/road-puppet-strings.ts";
import { roadDepth } from "../lib/road-layout.ts";
import { enemyDisplayHeight } from "../lib/road-enemy-layout.ts";

test("painted threads follow the controller's flipped hand and each lowered body's shoulder", () => {
  for (const width of [374, 936]) {
    const height = (width * 2) / 3,
      master = { kind: "pumpety", x: 400, lane: 0.6, facing: -1 };
    const dolls = [
      { kind: "golem", x: 200, lane: 0.8, pose: "drag", facing: 1 },
      { kind: "puppet", x: 300, lane: 0.9, pose: "drag", facing: 1 },
    ];
    const state = { scene: "escape", stage: "forest", enemies: [master, ...dolls] };
    const contacts = puppetStringContacts(state, width, height, true);
    assert.equal(contacts.length, 2);
    assert.deepEqual(contacts[0].from, contacts[1].from);
    assert.ok(contacts[0].from.x < master.x);
    master.facing = 1;
    assert.ok(puppetStringContacts(state, width, height, true)[0].from.x > master.x);
    for (const [i, c] of contacts.entries()) {
      const rise = (dolls[i].lane - c.to.lane) * roadDepth(width, height);
      const size = enemyDisplayHeight(dolls[i], width, height);
      assert.ok(
        rise > size * 0.2 && rise < size * 0.5,
        "thread attaches inside the lowered upper body",
      );
    }
    assert.deepEqual(puppetStringContacts({ ...state, scene: undefined }, width, height, true), []);
  }
});
