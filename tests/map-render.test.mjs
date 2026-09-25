import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState, act, settle, testState } from "../lib/game.ts";
import { stories } from "../lib/stories.ts";
import { nextStage, prologueStages } from "../lib/prologue.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { adventureFrame, adventureAction } from "../lib/adventure-presentation.ts";
const OPENING = nextStage(initialState(0)).quest;
const begin = (s = initialState(1000)) =>
  act(s, { type: "start", id: nextStage(s).quest }, s.updatedAt);
const frameFor = (state, now = state.updatedAt) =>
  adventureFrame({ squad: state.squads[0], now, ready: true, paused: false, startQuest: OPENING });
const imageAlias = {
  "next/image": fileURLToPath(
    new URL("../node_modules/vinext/dist/shims/image.js", import.meta.url),
  ),
};
await mkdir(new URL("../work/", import.meta.url), { recursive: true });
const output = new URL("../work/map-render.mjs", import.meta.url);
await build({
  entryPoints: ["app/map-stage.tsx"],
  outfile: fileURLToPath(output),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: imageAlias,
  jsx: "automatic",
});
const { MapStage } = await import(output.href);
const equipmentOutput = new URL("../work/equipment-render.mjs", import.meta.url);
await build({
  entryPoints: ["app/equipment-panels.tsx"],
  outfile: fileURLToPath(equipmentOutput),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: imageAlias,
  jsx: "automatic",
});
const { CharacterPanel, InventoryPanel } = await import(equipmentOutput.href);
test("Mira and Finn show exactly one fixed active skill and a usable passive slot", () => {
  for (const hero of ["mira", "finn"]) {
    const state = testState(1000, 19, 17, 5000);
    state.owned = [hero];
    const html = renderToStaticMarkup(
      createElement(CharacterPanel, { state, ready: true, onAction: () => true }),
    );
    assert.equal((html.match(/<small>アクティブ技<\/small>/g) || []).length, 1);
    assert.equal((html.match(/<small>パッシブ技<\/small>/g) || []).length, 1);
    assert.ok(html.includes('aria-label="アクティブ技・変更不可"'));
    assert.ok(!html.includes("アクティブ技・セットなし"));
  }
});
const shopOutput = new URL("../work/shop-render.mjs", import.meta.url);
await build({
  entryPoints: ["app/shop-panel.tsx"],
  outfile: fileURLToPath(shopOutput),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: imageAlias,
  jsx: "automatic",
});
const { ShopPanel } = await import(shopOutput.href);

test("characters and shared bag expose starting equipment and trade cargo without requiring departure", () => {
  const s = initialState(1000),
    before = structuredClone(s),
    character = renderToStaticMarkup(
      createElement(CharacterPanel, { state: s, ready: true, onAction: () => true }),
    );
  assert.match(character, /アリア/);
  assert.match(character, /レオン/);
  assert.match(character, /最大HP 62/);
  assert.match(character, /風の二連矢/);
  assert.match(character, /使い慣れた弓/);
  assert.match(character, /旅の服/);
  assert.match(character, /付け替える/);
  assert.doesNotMatch(character, /パーティ編成/);
  const bag = renderToStaticMarkup(createElement(InventoryPanel, { state: s }));
  for (const name of [
    "お金",
    "薬草",
    "鉱石",
    "アリアの村の交易品",
    "レオンの村の交易品",
    "アリアが装備中",
  ])
    assert.ok(bag.includes(name), name);
  assert.doesNotMatch(bag, /苔灯|森の苔の標本|木材/);
  assert.deepEqual(s, before);
});

test("shop renders only unlocked goods, prices and affordability and the bag labels bought equipment", () => {
  let s = initialState(1000);
  for (const { quest } of prologueStages.slice(0, 3)) {
    s.done[quest] = 1;
    s.story.departed.push(quest);
    s.story.completed.push(quest);
    s.story.read.push(quest + "-return");
  }
  s.gold = 500;
  s = act(s, { type: "start", id: "tower-road", readDeparture: true }, 1000);
  s = act(s, { type: "buy", id: "ash-bow" }, 1000);
  const shop = renderToStaticMarkup(
    createElement(ShopPanel, { state: s, ready: true, onAction: () => true }),
  );
  assert.match(shop, /400 G/);
  assert.match(shop, /トネリコの弓/);
  assert.match(shop, /100 Gで購入/);
  assert.match(shop, /アリア用/);
  assert.doesNotMatch(shop, /補強した弓|丈夫な作業着/);
  const poor = renderToStaticMarkup(
    createElement(ShopPanel, { state: { ...s, gold: 0 }, ready: true, onAction: () => true }),
  );
  // Only purchase is disabled: unaffordable goods remain inspectable.
  assert.equal((poor.match(/disabled=""/g) || []).length, 1);
  assert.equal((poor.match(/class="shop-slot"/g) || []).length, 2);
  assert.equal((poor.match(/<section/g) || []).length, 1);
  assert.match(poor, /あと 100 G/);
  const bag = renderToStaticMarkup(createElement(InventoryPanel, { state: s }));
  assert.match(bag, /トネリコの弓/);
  assert.match(bag, /バッグ内 1/);
});
const storyOutput = new URL("../work/story-render.mjs", import.meta.url);
await build({
  entryPoints: ["app/story-scenes.tsx"],
  outfile: fileURLToPath(storyOutput),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: imageAlias,
  jsx: "automatic",
});
const { StoryReader, Banter } = await import(storyOutput.href);
const phoneOutput = new URL("../work/phone-render.mjs", import.meta.url);
await build({
  entryPoints: ["app/phone-game.tsx"],
  outfile: fileURLToPath(phoneOutput),
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  alias: imageAlias,
  jsx: "automatic",
});
const { PhoneGame } = await import(phoneOutput.href);

test("dialogue and banter show close-up portraits and the trade still appears from the first page", () => {
  const story = stories.find((st) => st.id === "village-trade-return");
  const first = renderToStaticMarkup(
    createElement(StoryReader, { story, ready: true, onRead: () => true, onClose: () => {} }),
  );
  assert.ok(first.includes(story.lines[0].text));
  assert.ok(!first.includes(story.lines[1].text));
  const lines = [
      { speaker: "aria", text: "お疲れさま。" },
      { speaker: "leon", text: "無事に着いたな。" },
      { text: "ふたりは顔を見合わせた。" },
    ],
    before = structuredClone(lines);
  const chat = renderToStaticMarkup(createElement(Banter, { lines, onRead: () => {} }));
  assert.match(chat, /face-portrait/);
  assert.ok(chat.includes("/portraits/aria-leon-expressions-v2.webp"));
  assert.match(chat, /background-size:400% 400%/);
  assert.equal((chat.match(/face-portrait/g) || []).length, 1);
  assert.ok(!chat.includes(lines[1].text));
  assert.doesNotMatch(chat, /class="sprite/);
  assert.deepEqual(lines, before);
  for (let line = 0; line < story.lines.length; line += 3)
    assert.equal(storyArtAt(story.id, line)?.src, "/stories/village-trade-handover.webp");
  assert.ok(first.includes("/stories/village-trade-handover.webp"));
});

test("prologue guides the first quest choice before departure and keeps actions below chat", () => {
  const render = (s) =>
    renderToStaticMarkup(
      createElement(PhoneGame, {
        game: {
          s,
          clock: 1000,
          ready: true,
          otherTab: false,
          profile: { id: "test" },
          dispatch: () => true,
        },
      }),
    );
  const fresh = initialState(1000),
    html = render(fresh);
  assert.doesNotMatch(html, />出発</);
  assert.match(html, />キャラクター</);
  assert.match(html, /aria-label="持ちものを開く"/);
  assert.doesNotMatch(html, /phone-wallet|>お店</);
  assert.match(html, /id="first-quest-guide"/);
  assert.match(html, /まず「クエスト」で/);
  assert.match(html, /行き先を選ぼう/);
  assert.match(html, /aria-describedby="first-quest-guide"/);
  assert.doesNotMatch(html, /first-departure-guide/);
  assert.equal((html.match(/aria-label="クエストを開く"/g) || []).length, 1);
  assert.match(html, /quest-scroll.png/);
  assert.doesNotMatch(html, /idle-map-note|>クエストを選ぶ<|何度でも/);
  assert.ok(html.indexOf("journey-banter") < html.indexOf("adventure-actions"));
  assert.ok(html.indexOf("adventure-actions") < html.indexOf("phone-navigation"));
  assert.match(html, /aria-label="旅の手帳：ヒント・思い出・アルバム・設定"/);
  assert.doesNotMatch(
    html,
    /はじまりの隊|団長の応援|>編成<|>帰還<|>パーティ<|>拠点<|>思い出<|>出発する</,
  );
  const running = render(
    act(fresh, { type: "start", id: "village-trade", readDeparture: true }, 1000),
  );
  assert.match(running, /探索マップ/);
  assert.doesNotMatch(running, /phaser-assist-controls|>手助けする<|>回復<|>寄り道</);
  assert.match(running, />帰還</);
  assert.doesNotMatch(running, /団長の応援|>編成<|>パーティ<|>拠点</);
  const cleared = settle(
    act(fresh, { type: "start", id: "village-trade", readDeparture: true }, 1000),
    3601000,
  ).state;
  const after = render(act(cleared, { type: "readStory", id: "village-trade-return" }, 3601000));
  assert.doesNotMatch(after, /quest-tutorial|何度でも|>クエストを選ぶ<|idle-map-note/);
});

test("stage progress retains the completed scenery until the next departure", () => {
  const render = (s) =>
    renderToStaticMarkup(
      createElement(PhoneGame, {
        game: {
          s,
          clock: s.updatedAt,
          ready: true,
          otherTab: false,
          profile: { id: "test" },
          dispatch: () => true,
        },
      }),
    );
  let state = initialState(1000),
    background = "/scenery/forest-background.webp";
  for (const stage of prologueStages) {
    const idle = render(state);
    assert.ok(idle.includes(background));
    assert.doesNotMatch(idle, /第一章 ·|undefined|>パーティ<|>拠点</);
    state = act(state, { type: "start", id: stage.quest, readDeparture: true }, state.updatedAt);
    const running = render(state);
    assert.match(running, /探索マップ/);
    if (stage.quest !== "village-trade")
      assert.ok(
        running.includes(
          "/scenery/" +
            (stage.quest === "tower-restoration"
              ? "old-waterway"
              : stage.quest === "tower-moss-removal"
                ? "tower-drainage-open"
                : stage.quest) +
            "-background.webp",
        ),
      );
    if (stage.quest === "evening-trade-road") {
      const battle = structuredClone(state);
      battle.squads[0].run.node = 1;
      battle.squads[0].run.phase = "work";
      assert.match(render(battle), /道を開きながら前へ/);
      assert.doesNotMatch(render(battle), /いたずらを阻止中/);
    }
    // Render progression with sufficient training; difficulty has its own simulations.
    if (prologueStages.indexOf(stage) >= 6)
      for (const hero of state.owned) state.xp[hero] = 30 * 19 ** 2;
    state = settle(state, state.updatedAt + 3600000).state;
    state = act(state, { type: "readStory", id: stage.quest + "-return" }, state.updatedAt);
    background =
      stage.quest === "village-trade"
        ? "/scenery/forest-background.webp"
        : "/scenery/" +
          (["tower-restoration", "tower-moss-removal"].includes(stage.quest)
            ? "tower-drainage-open"
            : stage.quest) +
          "-background.webp";
    assert.ok(render(state).includes(background));
  }
});

test("every restored expedition location renders with finite character coordinates", () => {
  let state = begin();
  const visited = new Set();
  for (let i = 0; i < 10000 && state.squads[0].run; i++) {
    const squad = state.squads[0],
      node = squad.run.node;
    if (!visited.has(node)) {
      const html = renderToStaticMarkup(
        createElement(MapStage, {
          state,
          squad,
          now: state.updatedAt,
          onAction: () => {},
          ready: true,
          startQuest: OPENING,
        }),
      );
      assert.match(html, /旅の道のり/);
      assert.doesNotMatch(html, /NaN|undefined%/);
      for (const member of frameFor(state).members) {
        assert.ok(Number.isFinite(member.x) && Number.isFinite(member.y));
        assert.ok(member.x >= 0 && member.x <= 1 && member.y >= 0 && member.y <= 1);
      }
      visited.add(node);
      if (squad.run.road?.ambushNode !== undefined) visited.add(squad.run.road.ambushNode);
    }
    if (squad.run.road?.ambushNode !== undefined) visited.add(squad.run.road.ambushNode);
    state = settle(state, state.squads[0].run.nextAt).state;
  }
  assert.equal(visited.size, 15);
});

test("effects follow current events, expire on resume, and do not alter the save", () => {
  const state = begin(),
    squad = state.squads[0],
    run = squad.run;
  run.node = 1;
  run.events = [
    { id: "1-1-2000-hit-1-leon-1", at: 2000, kind: "hit", hero: "leon", amount: 10, text: "攻撃" },
    {
      id: "1-0-2100-hit-1-aria-2",
      at: 2100,
      kind: "hit",
      hero: "aria",
      amount: 4,
      text: "前の地点",
    },
  ];
  run.scene = { at: 2000, kind: "burst", title: "全員必殺！ 星灯りの大応援", lines: ["任せて！"] };
  const before = structuredClone(state);
  const render = (now) =>
    renderToStaticMarkup(
      createElement(MapStage, {
        state,
        squad,
        now,
        onAction: () => {},
        ready: true,
        startQuest: OPENING,
      }),
    );
  const current = render(2200);
  assert.equal(frameFor(state, 2200).events.length, 1);
  assert.match(current, /finisher-scene burst/);
  assert.match(current, /--scene-age:-200ms/);
  assert.doesNotMatch(render(7000), /finisher-scene burst/);
  assert.equal(frameFor(state, 7000).events.length, 0);
  assert.doesNotMatch(render(1500), /finisher-scene burst/);
  assert.equal(frameFor(state, 1500).events.length, 0);
  assert.deepEqual(state, before);
});

function mapKey(state, key, ready = true, paused = false) {
  const tree = MapStage({
    state,
    squad: state.squads[0],
    now: state.updatedAt,
    onAction: (action) => {
      state = act(state, action, state.updatedAt);
    },
    ready,
    paused,
    startQuest: OPENING,
  });
  const map = [tree.props.children]
    .flat()
    .find((node) => node?.props?.className === "adventure-map phaser-map");
  return {
    map,
    press() {
      map.props.onKeyDown({ key, target: map, currentTarget: map, preventDefault() {} });
      return state;
    },
  };
}
test("keyboard map assistance works without separate buttons and respects input guards", () => {
  const idle = initialState(1000);
  assert.equal(mapKey(idle, "Enter").map.props.tabIndex, undefined);
  assert.deepEqual(mapKey(idle, "Enter").press(), idle);
  const state = begin(idle);
  const after = mapKey(state, "Enter").press();
  assert.equal(after.squads[0].run.hits, 1);
  for (const [ready, paused] of [
    [false, false],
    [true, true],
  ]) {
    assert.equal(mapKey(state, "Enter", ready, paused).map.props.tabIndex, undefined);
    assert.deepEqual(mapKey(state, "Enter", ready, paused).press(), state);
  }
  assert.equal(
    adventureAction(
      { squad: state.squads[0], ready: false, paused: false, now: 1000, startQuest: OPENING },
      "help",
    ),
    null,
  );
});
test("resting keyboard assistance heals and H heals without striking", () => {
  const state = begin();
  for (const health of Object.values(state.squads[0].run.health)) health.hp = 0;
  state.squads[0].run.phase = "rest";
  for (const key of ["Enter", " ", "h"]) {
    const after = mapKey(state, key).press().squads[0].run;
    assert.ok(Object.values(after.health).some((health) => health.hp > 0));
    assert.equal(after.phase, "move");
  }
  state.squads[0].run.phase = "work";
  state.squads[0].run.health.aria.hp = 10;
  state.squads[0].run.health.leon.hp = state.squads[0].run.health.leon.maxHp;
  const before = state.squads[0].run;
  const after = mapKey(state, "H").press().squads[0].run;
  assert.ok(after.health.aria.hp > before.health.aria.hp);
  assert.equal(after.target, before.target);
});
