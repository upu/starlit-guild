import * as interludes from "../lib/interludes.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import * as game from "../lib/game.ts";
import * as stories from "../lib/stories.ts";
import * as prologue from "../lib/prologue.ts";
import * as art from "../lib/story-art.ts";
import * as originals from "../lib/original-characters.ts";
import { loadStoryScenes } from "./helpers/story-scene-modules.mjs";

function harness(name, initialProps) {
  const slots = [],
    timers = new Map(),
    listeners = new Set();
  let cursor = 0,
    effects = [],
    tree,
    props = initialProps,
    serial = 0;
  const document = {
    hidden: false,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
      return [
        slots[i],
        (value) => {
          slots[i] = typeof value === "function" ? value(slots[i]) : value;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      return (slots[i] ??= { current: initial });
    },
    useImperativeHandle(ref, create) {
      if (ref) ref.current = create();
    },
    useEffect(fn, deps) {
      const i = cursor++,
        old = slots[i];
      if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) {
        effects.push(() => {
          old?.cleanup?.();
          slots[i] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const modules = {
    "@/lib/interludes": interludes,
    react,
    "react/jsx-runtime": jsxRuntime,
    "next/image": { default: "img" },
    "lucide-react": { BookOpen: "icon", ChevronRight: "arrow", Images: "icon" },
    "./portrait": { Portrait: "portrait" },
    "./story-artwork": { StoryArtwork: "StoryArtwork" },
    "@/lib/game": game,
    "@/lib/stories": stories,
    "@/lib/prologue": prologue,
    "@/lib/story-art": art,
    "@/lib/original-characters": originals,
    "@/components/ui/dialog": Object.fromEntries(
      ["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription"].map((key) => [
        key,
        key,
      ]),
    ),
  };
  const exports = loadStoryScenes(modules, {
    document,
    window: { getSelection: () => null },
    setTimeout: (fn) => {
      const id = ++serial;
      timers.set(id, fn);
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  function render(next = props) {
    props = next;
    cursor = 0;
    effects = [];
    tree = exports[name](props);
    for (const effect of effects) effect();
    return tree;
  }
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap((child) => nodes(child))];
  }
  const find = (type) =>
    nodes(tree).find(
      (n) => n.type === type || n.type?.name === type || n.props?.className === type,
    );
  const text = (node) =>
    typeof node === "string"
      ? node
      : !node || typeof node !== "object"
        ? ""
        : [node.props?.children].flat(Infinity).map(text).join("");
  function click(label) {
    const button = nodes(tree).find((n) => n.type === "button" && text(n) === label);
    assert.ok(button, label);
    assert.ok(!button.props.disabled);
    button.props.onClick();
    render();
  }
  render();
  return {
    render,
    find,
    click,
    text: () => text(tree),
    exports,
    tick() {
      const [id, fn] = timers.entries().next().value || [];
      assert.ok(fn, "scheduled dialogue");
      timers.delete(id);
      fn();
      render();
    },
    timerCount: () => timers.size,
    visibility(hidden) {
      document.hidden = hidden;
      for (const fn of listeners) fn();
    },
  };
}

test("story and banter portraits keep the expression of each individual line", () => {
  const lines = [
    { speaker: "aria", text: "見つけた！", expression: "surprised" },
    { speaker: "aria", text: "よかった。", expression: "smile" },
  ];
  const story = harness("StoryLines", { lines });
  const rows = story.find("story-lines").props.children;
  assert.deepEqual(
    rows.map((row) => row.props.children[0].props.expression),
    ["surprised", "smile"],
  );
  const banter = harness("Banter", { lines });
  banter.tick();
  const history = banter.find("banter-copy").props.children;
  assert.deepEqual(
    Array.from(history, (row) => row.props.children[0].props.expression),
    ["surprised", "smile"],
  );
  // Equal words from a different scene can carry a different emotion.
  const next = [{ ...lines[1], expression: "worried" }];
  banter.render({ lines: next });
  banter.tick();
  assert.equal(
    banter.find("banter-copy").props.children.at(-1).props.children[0].props.expression,
    "worried",
  );
});

test("story reader retains all revealed lines for scrolling, reveals art at its action, and only finishes on the final line", () => {
  const story = stories.stories.find((st) => st.id === "tower-road-return");
  let read = 0,
    closed = 0;
  const h = harness("StoryReader", {
    story,
    ready: true,
    onRead: () => {
      read++;
      return true;
    },
    onClose: () => closed++,
  });
  for (let i = 0; i < story.lines.length; i++) {
    assert.deepEqual(h.find("StoryLines").props.lines, story.lines.slice(0, i + 1));
    assert.equal(h.find("ArtViewer").props.art, null);
    const hasFigure = !!h.find("figure");
    assert.equal(hasFigure, !!art.storyArtAt(story.id, i));
    assert.equal(read, 0);
    assert.equal(closed, 0);
    if (i + 1 < story.lines.length) {
      h.find("story-conversation").props.onClick();
      h.render();
    }
  }
  assert.ok(!h.text().includes("前へ"));
  assert.ok(!h.text().includes("次へ"));
  h.find("story-conversation").props.onClick();
  h.render();
  assert.equal(read, 1);
  assert.equal(closed, 1);
  h.find("story-conversation").props.onClick();
  assert.equal(read, 1, "finishing is not dispatched twice");
});

test("dialogue taps advance while drags and scrolls do not; keyboard and final readiness work", () => {
  const story = stories.stories.find((st) => st.id === "village-trade-departure");
  let read = 0,
    closed = 0;
  const props = {
    story,
    ready: false,
    departure: true,
    onRead: () => {
      read++;
      return true;
    },
    onClose: () => closed++,
  };
  const h = harness("StoryReader", props),
    viewport = { scrollTop: 0, scrollHeight: 300 };
  h.find("dialogue-page dialogue-history").props.ref.current = viewport;
  h.find("story-conversation").props.onPointerDown({ clientX: 30, clientY: 80 });
  h.find("story-conversation").props.onPointerMove({ clientX: 30, clientY: 40 });
  h.find("story-conversation").props.onClick();
  h.render();
  assert.equal(h.find("StoryLines").props.lines.length, 1, "drag does not advance");
  h.find("story-conversation").props.onPointerDown({ clientX: 30, clientY: 80 });
  viewport.scrollTop = 40;
  h.find("story-conversation").props.onClick();
  h.render();
  assert.equal(h.find("StoryLines").props.lines.length, 1, "scroll does not advance");
  h.find("story-conversation").props.onPointerDown({ clientX: 30, clientY: 80 });
  h.find("story-conversation").props.onClick();
  h.render();
  assert.equal(h.find("StoryLines").props.lines.length, 2);
  for (let i = 2; i < story.lines.length; i++) {
    h.find("story-conversation").props.onKeyDown({
      key: "Enter",
      repeat: false,
      preventDefault() {},
    });
    h.render();
  }
  h.find("story-conversation").props.onClick();
  assert.equal(read, 0);
  assert.equal(closed, 0);
  h.render({ ...props, ready: true });
  h.find("story-conversation").props.onKeyDown({ key: " ", repeat: false, preventDefault() {} });
  assert.equal(read, 1);
  assert.equal(closed, 1);
});

test("banter keeps a complete exchange while the route changes and pauses under dialogs or hidden tabs", () => {
  const lines = [
      { speaker: "aria", text: "最初の発言" },
      { speaker: "leon", text: "その返事" },
    ],
    next = [{ speaker: "leon", text: "次の場所" }];
  const props = { lines };
  const h = harness("Banter", props);
  assert.ok(h.text().includes(lines[0].text));
  assert.ok(!h.text().includes(lines[1].text));
  h.render({ ...props, lines: next });
  h.tick();
  assert.ok(h.text().includes(lines[0].text));
  assert.ok(h.text().includes(lines[1].text));
  assert.ok(!h.text().includes(next[0].text));
  assert.equal(h.find("button"), undefined);
  assert.equal(h.find("journey-banter journey-banter-history").props.onClick, undefined);
  h.render({ ...props, lines: next, paused: true });
  assert.equal(h.timerCount(), 0);
  h.render({ ...props, lines: next, paused: false });
  h.visibility(true);
  assert.equal(h.timerCount(), 0);
  h.visibility(false);
  h.tick();
  assert.ok(h.text().includes(next[0].text));
  assert.ok(h.text().includes(lines[0].text));
  assert.ok(h.text().includes(lines[1].text));
  const later = [{ speaker: "aria", text: "さらに次の発言" }];
  h.render({ ...props, lines: later });
  h.tick();
  assert.ok(h.text().includes(lines[0].text));
  assert.ok(h.text().includes(lines[1].text));
  assert.ok(h.text().includes(next[0].text));
  assert.ok(h.text().includes(later[0].text));
  const viewport = { scrollHeight: 900, clientHeight: 220, scrollTop: 100 };
  h.find("journey-banter journey-banter-history").props.ref.current = viewport;
  h.find("journey-banter journey-banter-history").props.onScroll({ currentTarget: viewport });
  h.render({ ...props, lines: [{ speaker: "leon", text: "歩幅を合わせよう。" }] });
  h.tick();
  assert.equal(viewport.scrollTop, 100, "reading history is not interrupted");
  viewport.scrollTop = 680;
  h.find("journey-banter journey-banter-history").props.onScroll({ currentTarget: viewport });
  viewport.scrollHeight = 1000;
  h.render({ ...props, lines: [{ speaker: "aria", text: "うん、一緒に行こう。" }] });
  h.tick();
  assert.equal(viewport.scrollTop, 1000, "following resumes from the bottom");
});

test("memories interleave departure and ending by stage; album stays separate and returns to the handbook", () => {
  let state = game.initialState(1000);
  // The library test needs cleared stories, independently of combat training requirements.
  for (const hero of state.owned) state.xp[hero] = 30 * 19 ** 2;
  for (const stage of prologue.prologueStages) {
    state = game.act(
      state,
      { type: "start", id: stage.quest, readDeparture: true },
      state.updatedAt,
    );
    state = game.settle(state, state.updatedAt + 3600000).state;
    state = game.act(state, { type: "readStory", id: stage.quest + "-return" }, state.updatedAt);
  }
  const h = harness("StoryLibrary", { state, onOpen: () => {} });
  const ordered = h.exports
    .memoryGroups(stories.availableStories(state))
    .flatMap((group) => group.items.map((st) => st.id));
  assert.deepEqual(
    Array.from(ordered),
    prologue.prologueStages.flatMap((stage) => [
      stage.quest + "-departure",
      stage.quest + "-return",
    ]),
  );
  assert.equal(h.find("img"), undefined);
  assert.equal(h.find("StoryAlbum"), undefined);
  assert.ok(!h.text().includes("アルバム"));
  let returned = false;
  const album = harness("StoryAlbum", {
    state,
    onBack: () => {
      returned = true;
    },
  });
  assert.ok(album.find("img"));
  album.click("旅の手帳へ戻る");
  assert.ok(returned);
});

test("banter stops after the idle exchange even with fresh arrays on every clock tick", () => {
  const lines = [
      { speaker: "aria", text: "準備できた？" },
      { speaker: "leon", text: "ああ。アリアを待ってた。" },
    ],
    before = structuredClone(lines);
  const props = { lines };
  const h = harness("Banter", props);
  assert.equal(h.timerCount(), 1);
  for (let i = 0; i < 10; i++) h.render({ ...props, lines: structuredClone(lines) });
  h.tick();
  const completed = h.text();
  assert.equal(h.timerCount(), 0);
  for (let i = 0; i < 10000; i++) {
    h.render({ ...props, lines: structuredClone(lines) });
    assert.equal(h.timerCount(), 0);
    assert.equal(h.text(), completed);
  }
  for (const entry of lines) assert.equal(h.text().split(entry.text).length - 1, 1);
  h.visibility(true);
  h.visibility(false);
  assert.equal(h.timerCount(), 0);
  h.render({ ...props, paused: true });
  h.render({ ...props, paused: false });
  assert.equal(h.timerCount(), 0);
  assert.equal(h.find("button"), undefined);
  assert.equal(h.find("journey-banter journey-banter-history").props.onClick, undefined);
  assert.deepEqual(lines, before);
});

test("each banter line keeps its own speaker portrait, including history and narration", () => {
  const lines = [
    { speaker: "aria", text: "先に行くね。" },
    { speaker: "leon", text: "足元に気をつけて。" },
    { text: "風が吹いた。" },
  ];
  const h = harness("Banter", { lines });
  h.tick();
  h.tick();
  const rows = h.find("banter-copy").props.children;
  assert.equal(rows.length, 3);
  assert.equal(rows[0].props.children[0].props.index, 0);
  assert.equal(rows[1].props.children[0].props.index, 1);
  assert.equal(rows[2].props.children[0], undefined);
  for (const line of lines) assert.ok(h.text().includes(line.text));
});

test("banter resumes for new content, finishes the exchange, and stops again", () => {
  const idle = [{ speaker: "aria", text: "準備はできたよ。" }],
    next = [
      { speaker: "leon", text: "出発しよう。" },
      { speaker: "aria", text: "うん、行こう！" },
    ];
  const props = { lines: idle },
    h = harness("Banter", props);
  assert.equal(h.timerCount(), 0);
  h.render({ ...props, lines: next });
  assert.equal(h.timerCount(), 1);
  h.tick();
  assert.ok(h.text().includes(next[0].text));
  assert.ok(!h.text().includes(next[1].text));
  h.tick();
  assert.ok(h.text().includes(next[1].text));
  assert.equal(h.timerCount(), 0);
  // Returning to an earlier exchange after different dialogue is still allowed.
  h.render(props);
  h.tick();
  assert.equal(h.timerCount(), 0);
  assert.equal(h.text().split(idle[0].text).length - 1, 2);
});

test("banter waits for initial dialogue and keeps history when no new lines arrive", () => {
  const props = { lines: [] },
    h = harness("Banter", props);
  assert.equal(h.find("button"), undefined);
  assert.equal(h.timerCount(), 0);
  const lines = [
    { speaker: "aria", text: "お待たせ。" },
    { speaker: "leon", text: "行こうか。" },
  ];
  h.render({ ...props, lines });
  h.tick();
  h.render(props);
  h.tick();
  assert.ok(h.text().includes(lines[0].text));
  assert.ok(h.text().includes(lines[1].text));
  assert.equal(h.timerCount(), 0);
  h.render({ ...props, lines: structuredClone(lines) });
  assert.equal(h.timerCount(), 0);
});

test("banter compares speakers as well as text and bounds genuine new history", () => {
  const text = "分かった。",
    props = { lines: [{ speaker: "aria", text }] },
    h = harness("Banter", props);
  h.render({ ...props, lines: [{ speaker: "leon", text }] });
  h.tick();
  assert.equal(h.text().split(text).length - 1, 2);
  assert.equal(h.timerCount(), 0);
  for (let i = 0; i < 105; i++) {
    h.render({ ...props, lines: [{ speaker: "aria", text: `発言-${i}` }] });
    h.tick();
    assert.equal(h.timerCount(), 0);
  }
  const entries = h.find("banter-copy").props.children;
  assert.equal(entries.length, 100);
  assert.ok(h.text().includes("発言-104"));
  assert.ok(!h.text().includes("発言-0"));
});

test("banter uses the latest pending exchange without replaying one that was withdrawn", () => {
  const lines = [{ speaker: "aria", text: "待機中。" }],
    props = { lines },
    h = harness("Banter", props);
  h.render({ ...props, lines: [{ speaker: "leon", text: "一時的な会話。" }] });
  assert.equal(h.timerCount(), 1);
  h.render({ ...props, lines: structuredClone(lines) });
  assert.equal(h.timerCount(), 0);
  const next = [{ speaker: "leon", text: "新しい道へ。" }];
  h.render({ ...props, lines: next, paused: true });
  assert.equal(h.timerCount(), 0);
  h.visibility(true);
  h.render({ ...props, lines: next });
  assert.equal(h.timerCount(), 0);
  h.visibility(false);
  assert.equal(h.timerCount(), 1);
  h.tick();
  assert.equal(h.timerCount(), 0);
  assert.ok(h.text().includes(next[0].text));
  assert.ok(!h.text().includes("一時的な会話。"));
});
