import test from "node:test";
import assert from "node:assert/strict";
import { testState, initialState, act, skipTo, settleOnScreen } from "../lib/game.ts";
import { guildUnlocked } from "../lib/guild-base.ts";
import { guildStories } from "../lib/guild-stories.ts";
import {
  guildHomeMembers,
  canTellGuildStory,
  nextGuildConversation,
} from "../lib/guild-presence.ts";
import { availableStories } from "../lib/stories.ts";
import { GUILD_FOUNDING_QUEST } from "../lib/chapter-four.ts";
import { guildLevel } from "../lib/guild-content.ts";
import { guildStock } from "../lib/guild-production.ts";
import { availableConsumables, consumableStock } from "../lib/consumables.ts";
import { parseBundle } from "../lib/save-format.ts";
import { portraitAtlases } from "../lib/portrait-expressions.ts";
const minute = 60000;
const ordinaryStory = guildStories.find((story) => story.id === "guild-waiting-for-a-charm");
const fresh = () => testState(1000, 37, 40, 100000);
const action = (s, type, more = {}) => act(s, { type, ...more }, s.guild?.lastAt ?? s.updatedAt);
const buy = (s, id, quantity = 10) => action(s, "guildBuy", { id, quantity });
const assign = (s, id, hero) => action(s, "guildAssign", { id, hero });
const plant = (s, id = "linde-1", name = "herb") => action(s, "guildPlant", { id, name });
const later = (s, minutes) => skipTo(s, (s.guild?.lastAt ?? s.updatedAt) + minutes * minute);
test("home conversations require their cast at home and an unread unlocked story", () => {
  let s = fresh();
  assert.equal(nextGuildConversation(s).id, ordinaryStory.id);
  assert.equal(canTellGuildStory(s, guildStories[0]), false, "first harvest has not happened");
  s = assign(s, "workbench", "lico");
  assert.ok(guildHomeMembers(s).includes("lico"), "workbench is in the home");
  assert.equal(canTellGuildStory(s, ordinaryStory), true);
  s = assign(s, "linde", "aria");
  assert.ok(!guildHomeMembers(s).includes("aria"));
  assert.equal(canTellGuildStory(s, ordinaryStory), false);
  assert.notEqual(nextGuildConversation(s)?.id, ordinaryStory.id);
  s = assign(s, "linde", undefined);
  s = action(s, "readStory", { id: ordinaryStory.id });
  assert.notEqual(nextGuildConversation(s)?.id, ordinaryStory.id, "read stories do not repeat");
  s.owned = s.owned.filter((id) => id !== "lico");
  assert.equal(canTellGuildStory(s, ordinaryStory), false, "missing members cannot speak");
  s.story.read.push(...guildStories.map((story) => story.id));
  assert.equal(nextGuildConversation(s), null);
  assert.equal(nextGuildConversation(initialState(1000)), null);
});

test("first harvest conversation waits until the gardeners have returned home", () => {
  let s = assign(assign(plant(buy(fresh(), "herb-seed")), "linde", "aria"), "brekka", "lico");
  s = later(s, 60);
  assert.ok(s.guild.cultivation > 0);
  assert.equal(canTellGuildStory(s, guildStories[0]), false);
  s = assign(assign(s, "linde", undefined), "brekka", undefined);
  assert.equal(nextGuildConversation(s).id, "guild-first-harvest");
});
function roundtrip(state) {
  const id = "44444444-4444-4444-8444-444444444444";
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "guild", test: true, state }],
        serial: 0,
        sound: false,
        cloudAt: 0,
      }),
    ),
  ).profiles[0].state;
}
test("guild opens at the fifth-chapter boundary, not merely clearing the founding stage", () => {
  const s = fresh();
  assert.equal(guildUnlocked(initialState(1000)), false);
  assert.equal(guildUnlocked(s), true);
  s.story.read = s.story.read.filter((id) => id !== GUILD_FOUNDING_QUEST + "-return");
  assert.equal(guildUnlocked(s), false);
  assert.throws(() => buy(s, "herb-seed"));
  assert.throws(() => action(s, "readStory", { id: ordinaryStory.id }));
  assert.equal(availableStories(s).filter((story) => story.chapter === "guild").length, 0);
  assert.equal(
    availableConsumables(s).some((item) => item.id === "guild-tea"),
    false,
  );
  assert.equal(
    guildUnlocked(action(s, "readStory", { id: GUILD_FOUNDING_QUEST + "-return" })),
    true,
  );
});
test("old saves remain intact and optional conversations persist without rewards or quest movement", () => {
  const before = fresh();
  assert.equal(roundtrip(before).guild, undefined);
  let s = action(before, "readStory", { id: ordinaryStory.id });
  s = action(s, "readStory", { id: ordinaryStory.id });
  assert.equal(s.story.read.filter((id) => id === ordinaryStory.id).length, 1);
  assert.equal(s.gold, before.gold);
  assert.deepEqual(s.squads, before.squads);
  assert.ok(roundtrip(s).story.read.includes(ordinaryStory.id));
  for (const story of guildStories)
    for (const line of story.lines)
      if (line.speaker)
        assert.ok(portraitAtlases[line.speaker].expressions.includes(line.expression));
});
test("ripe crops wait without a caretaker, then harvest once and replant only with seeds", () => {
  let s = plant(buy(fresh(), "herb-seed", 1));
  const herbs = s.herbs;
  s = later(s, 500);
  assert.equal(s.herbs, herbs);
  assert.ok(s.guild.plots["linde-1"].batch);
  s = assign(s, "linde", "aria");
  assert.equal(s.herbs, herbs + 3);
  assert.ok(availableStories(s).some((story) => story.id === "guild-first-harvest"));
  assert.equal(s.guild.plots["linde-1"].batch, undefined);
  assert.equal(later(roundtrip(s), 500).herbs, herbs + 3);
});
test("experts and levels affect the next planting; all three roles exclude one another", () => {
  const normal = plant(assign(buy(fresh(), "herb-seed"), "linde", "finn"));
  let s = plant(assign(buy(fresh(), "herb-seed"), "linde", "aria"));
  assert.equal(normal.guild.plots["linde-1"].batch.readyAt - 1000, 54 * minute);
  assert.equal(s.guild.plots["linde-1"].batch.readyAt - 1000, 45 * minute);
  assert.equal(s.guild.plots["linde-1"].batch.quantity, 5);
  for (const role of ["brekka", "workbench"]) assert.throws(() => assign(s, role, "aria"));
  assert.throws(() => assign(s, "brekka", "missing"));
  assert.deepEqual(s.squads, fresh().squads);
  s = later(s, 24 * 60);
  assert.equal(s.guild.cultivation, 10);
  assert.equal(guildLevel(s.guild.cultivation), 3);
  assert.equal(s.guild.materials["herb-seed"], 0);
});
test("Brekka produces dried moss, Linde rejects moss, and planting can stop after harvest", () => {
  let s = buy(assign(fresh(), "brekka", "lico"), "moss-spore");
  assert.throws(() => plant(s, "linde-1", "moss"));
  s = plant(s, "brekka-1", "moss");
  s = action(s, "guildReplant", { id: "brekka-1", value: false });
  s = later(s, 1000);
  assert.equal(guildStock(s, "dried-moss"), 4);
  assert.equal(guildStock(s, "moss-spore"), 9);
  assert.equal(s.guild.plots["brekka-1"].batch, undefined);
});
test("crafting charges per batch, pauses without a worker, and completes a finite queue", () => {
  let s = buy(fresh(), "honey");
  s.herbs = 100;
  assert.throws(() => action(s, "guildCraft", { id: "tea" }));
  s = assign(s, "workbench", "mira");
  s = action(s, "guildCraft", { id: "tea", quantity: 2 });
  assert.equal(s.herbs, 98);
  assert.equal(guildStock(s, "honey"), 9);
  assert.equal(s.guild.work.batch.readyAt - 1000, 8.25 * minute);
  s = later(s, 2);
  s = assign(s, "workbench", undefined);
  s = later(roundtrip(s), 1000);
  assert.equal(consumableStock(s, "guild-tea"), 0);
  s = assign(s, "workbench", "mira");
  s = later(s, 6.25);
  assert.equal(consumableStock(s, "guild-tea"), 1);
  assert.equal(guildStock(s, "honey"), 8);
  s = later(s, 9);
  assert.equal(consumableStock(s, "guild-tea"), 2);
  assert.equal(s.guild.work, undefined);
});
test("repeat crafting resumes on material purchase and caps levels; cancel consumes only the started batch", () => {
  let s = assign(buy(fresh(), "honey", 1), "workbench", "leon");
  s.herbs = 100;
  s = action(s, "guildCraft", { id: "tea", value: true });
  s = later(s, 100);
  assert.equal(consumableStock(s, "guild-tea"), 1);
  assert.equal(s.guild.work.batch, undefined);
  s = buy(s, "honey");
  assert.ok(s.guild.work.batch);
  s = later(s, 500);
  assert.equal(guildLevel(s.guild.crafting), 3);
  s = buy(s, "honey");
  const herbs = s.herbs;
  s = action(s, "guildCancel");
  assert.equal(later(s, 500).herbs, herbs);
  assert.equal(guildStock(s, "honey"), 9);
});
test("one long offline settlement equals many ticks including harvest-fed crafting", () => {
  let s = assign(
    assign(buy(buy(fresh(), "herb-seed"), "honey"), "linde", "aria"),
    "workbench",
    "mira",
  );
  s.herbs = 0;
  s = plant(s);
  s = action(s, "guildCraft", { id: "tea", value: true });
  const long = later(s, 600);
  let ticks = s;
  for (let i = 0; i < 600; i++) ticks = later(ticks, 1);
  assert.deepEqual(long.guild, ticks.guild);
  assert.equal(long.herbs, ticks.herbs);
  assert.deepEqual(long.consumables, ticks.consumables);
});
test("offline harvest does not advance an adventure and clock rollback never grants twice", () => {
  let s = plant(assign(buy(fresh(), "herb-seed", 1), "linde", "aria"));
  s = action(s, "start", { id: "village-trade", readDeparture: true });
  const before = structuredClone(s.squads[0].run);
  s = later(s, 120);
  assert.equal(s.squads[0].run.node, before.node);
  assert.deepEqual(s.squads[0].run.health, before.health);
  const herbs = s.herbs,
    checkpoint = s.guild.lastAt;
  s = skipTo(s, checkpoint - minute);
  s = settleOnScreen(s, checkpoint);
  assert.equal(s.herbs, herbs);
  assert.equal(s.guild.lastAt, checkpoint);
});
test("stock caps hold ripe crops and pending crafts without discarding output", () => {
  let s = plant(assign(buy(fresh(), "carrot-seed", 1), "linde", "aria"), "linde-1", "carrot");
  s.guild.materials.carrot = 9999;
  s = later(s, 100);
  assert.ok(s.guild.plots["linde-1"].batch);
  s.guild.materials.carrot = 0;
  s = later(s, 1);
  assert.equal(guildStock(s, "carrot"), 4);
  s = assign(buy(s, "honey"), "workbench", "mira");
  s.herbs = 100;
  s = action(s, "guildCraft", { id: "tea", quantity: 1 });
  s.consumables = { items: { "guild-tea": 9999 }, assigned: {} };
  s = later(s, 100);
  assert.ok(s.guild.work.batch);
  s.consumables.items["guild-tea"] = 9998;
  s = later(s, 1);
  assert.equal(consumableStock(s, "guild-tea"), 9999);
  assert.equal(s.guild.work, undefined);
});
test("crafted consumables use the shared departure path once per new run", () => {
  let s = fresh();
  s.consumables = { items: { "guild-lunch": 2 }, assigned: { aria: "guild-lunch" } };
  s = action(s, "start", { id: "village-trade", readDeparture: true });
  assert.equal(s.squads[0].run.consumableEffects.aria, "guild-lunch");
  assert.equal(consumableStock(s, "guild-lunch"), 1);
  assert.equal(consumableStock(roundtrip(later(s, 100)), "guild-lunch"), 1);
});
test("save validation rejects impossible roles, crops, times and stock; invalid purchases are atomic", () => {
  const s = plant(assign(buy(fresh(), "herb-seed"), "linde", "aria"));
  assert.deepEqual(roundtrip(s).guild, s.guild);
  for (const corrupt of [
    (g) => {
      g.roles.brekka = "aria";
    },
    (g) => {
      g.roles.brekka = "not-owned";
    },
    (g) => {
      g.plots["linde-1"].crop = "moss";
    },
    (g) => {
      g.plots["linde-1"].batch.readyAt = 0;
    },
    (g) => {
      g.materials["herb-seed"] = -1;
    },
    (g) => {
      g.materials.unknown = 1;
    },
  ]) {
    const invalid = structuredClone(s);
    corrupt(invalid.guild);
    assert.throws(() => roundtrip(invalid));
  }
  for (const quantity of [-1, 0, 1.5, NaN, Infinity, 999])
    assert.throws(() => buy(s, "herb-seed", quantity));
  const before = structuredClone(s);
  assert.throws(() => buy(s, "unknown"));
  assert.deepEqual(s, before);
});
