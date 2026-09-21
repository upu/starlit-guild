import * as interludes from "../lib/interludes.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { compactCss } from "./compact-css.mjs";

// Isolate the reader controls from game state; this is not a mounted-browser test.
const source = readFileSync(new URL("../app/story-scenes.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  reportDiagnostics: true,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const viewerCode = ts.transpileModule(
  readFileSync(new URL("../app/story-viewers.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const memoryCode = ts.transpileModule(
  readFileSync(new URL("../app/story-memory-groups.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const gestureCode = ts.transpileModule(
  readFileSync(new URL("../app/story-gesture-handlers.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const story = {
  id: "dialog-test",
  title: "会話の確認",
  place: "道中",
  chapter: "departure",
  lines: [{ text: "最初の発言" }, { text: "続きの発言" }, { text: "最後の発言" }],
};
const fixtureArt = { src: "/fixture.png", alt: "確認用", width: 800, height: 600 };

function harness(overrides = {}, { withArt = false, selection = null } = {}) {
  const slots = [],
    exports = {};
  let cursor = 0,
    effects = [],
    tree,
    read = 0,
    closed = 0;
  let props = {
    story,
    ready: true,
    onRead: () => {
      read++;
      return true;
    },
    onClose: () => {
      closed++;
    },
    ...overrides,
  };
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [
        slots[i],
        (value) => {
          slots[i] = value;
        },
      ];
    },
    useRef(initial) {
      return (slots[cursor++] ??= { current: initial });
    },
    useImperativeHandle(ref, create) {
      if (ref) ref.current = create();
    },
    useEffect(fn, deps) {
      const i = cursor++,
        old = slots[i];
      if (!old || deps.some((value, j) => !Object.is(value, old[j]))) {
        slots[i] = deps;
        effects.push(fn);
      }
    },
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const modules = {
    "@/lib/interludes": interludes,
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/image": { default: "img" },
    "lucide-react": { BookOpen: "icon", ChevronRight: "icon" },
    "./portrait": { Portrait: "portrait" },
    "./story-artwork": { StoryArtwork: "StoryArtwork" },
    "@/lib/game": { heroes: [], allQuests: [] },
    "@/lib/original-characters": { originalCharacters: [] },
    "@/lib/prologue": { prologueStages: [], storyStages: [] },
    "@/lib/stories": {},
    "@/lib/story-art": { storyArtAt: () => (withArt ? fixtureArt : null) },
    "@/components/ui/dialog": Object.fromEntries(
      ["Dialog", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription"].map(
        (name) => [name, name],
      ),
    ),
  };
  const requireModule = (id) => {
    assert.ok(id in modules, id);
    return modules[id];
  };
  for (const [id, code] of [
    ["./story-viewers", viewerCode],
    ["./story-memory-groups", memoryCode],
    ["./story-gesture-handlers", gestureCode],
  ]) {
    const moduleExports = {};
    vm.runInNewContext(code, { exports: moduleExports, require: requireModule });
    modules[id] = moduleExports;
  }
  vm.runInNewContext(compiled.outputText, {
    exports,
    require: requireModule,
    window: { getSelection: () => selection },
  });
  function render(next = props) {
    props = next;
    cursor = 0;
    effects = [];
    tree = exports.StoryReader(props);
    for (const effect of effects) effect();
  }
  const nodes = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const find = (name) =>
    nodes(tree).find(
      (node) => node.type === name || node.type?.name === name || node.props?.className === name,
    );
  const text = (node) =>
    typeof node === "string" || typeof node === "number"
      ? String(node)
      : !node || typeof node !== "object"
        ? ""
        : [node.props?.children].flat(Infinity).map(text).join("");
  render();
  return {
    find,
    render,
    props,
    text: () => text(tree),
    counts: () => ({ read, closed }),
    click() {
      find("story-conversation").props.onClick();
      render();
    },
  };
}

test("story reader TSX has no syntax diagnostics", () => {
  assert.deepEqual(
    compiled.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error),
    [],
  );
});

test("intermediate lines show one continuation icon, not an instruction or final action", () => {
  const h = harness({ departure: true });
  for (let page = 0; page < story.lines.length - 1; page++) {
    assert.equal(h.find("story-continue").props.children, "▼");
    assert.equal(h.text().split("▼").length - 1, 1);
    assert.equal(h.find("story-end-action"), undefined);
    assert.ok(!/タップ|会話を進める|冒険を始める|閉じる/.test(h.text()));
    assert.equal(h.find("story-conversation").props["aria-label"], "会話を進める");
    assert.equal(h.find("story-tap-hint").props["aria-hidden"], "true");
    assert.equal(h.find("StoryLines").props.lines.length, page + 1);
    h.click();
  }
  assert.equal(h.find("story-continue"), undefined);
  assert.equal(h.find("story-end-action").props.children, "冒険を始める");
  assert.equal(h.find("story-conversation").props["aria-label"], "冒険を始める");
  assert.deepEqual(h.counts(), { read: 0, closed: 0 });
  h.click();
  h.click();
  assert.deepEqual(h.counts(), { read: 1, closed: 1 });
});

test("ordinary conversations say only Close on their final line, including a one-line story", () => {
  for (const lines of [story.lines, story.lines.slice(0, 1)]) {
    const h = harness({ story: { ...story, lines } });
    for (let page = 1; page < lines.length; page++) h.click();
    assert.equal(h.find("story-end-action").props.children, "閉じる");
    assert.equal(h.find("story-conversation").props["aria-label"], "閉じる");
    assert.equal(h.find("story-continue"), undefined);
    assert.ok(!h.text().includes("タップ"));
    h.click();
    assert.deepEqual(h.counts(), { read: 1, closed: 1 });
  }
});

test("final readiness and unsuccessful completion do not accidentally close the reader", () => {
  let attempts = 0;
  const props = {
    story: { ...story, lines: story.lines.slice(0, 1) },
    ready: false,
    departure: true,
    onRead: () => ++attempts > 1,
  };
  const h = harness(props);
  assert.equal(h.find("story-conversation").props["aria-disabled"], true);
  h.click();
  assert.equal(attempts, 0);
  h.render({ ...h.props, ready: true });
  assert.equal(h.find("story-conversation").props["aria-disabled"], false);
  h.click();
  assert.equal(attempts, 1);
  assert.equal(h.counts().closed, 0);
  h.click();
  h.click();
  assert.equal(attempts, 2);
  assert.equal(h.counts().closed, 1);
});

test("dragging, scrolling, and cancelled pointers do not advance a line", () => {
  const h = harness(),
    viewport = { scrollTop: 0, scrollHeight: 600 };
  h.find("dialogue-page dialogue-history").props.ref.current = viewport;
  const control = () => h.find("story-conversation").props;
  const down = () => control().onPointerDown({ clientX: 30, clientY: 100 });
  down();
  control().onPointerMove({ clientX: 30, clientY: 50 });
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 1);
  down();
  viewport.scrollTop = 20;
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 1);
  down();
  control().onPointerCancel();
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 1);
  down();
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 2);
  assert.equal(viewport.scrollTop, 600, "new dialogue follows the latest line");
});

test("repeated dialogue clicks advance even when the document has a text selection", () => {
  const h = harness({}, { selection: { isCollapsed: false } });
  for (let page = 1; page < story.lines.length; page++) {
    h.find("story-conversation").props.onPointerDown({ clientX: 30, clientY: 100 });
    h.click();
    assert.equal(h.find("StoryLines").props.lines.length, page + 1);
  }
  h.click();
  h.click();
  assert.deepEqual(h.counts(), { read: 1, closed: 1 });
});

test("Enter and Space still advance without auto-repeating or consuming arrow keys", () => {
  const h = harness();
  let prevented = 0;
  const key = (key, repeat = false) => {
    h.find("story-conversation").props.onKeyDown({
      key,
      repeat,
      preventDefault() {
        prevented++;
      },
    });
    h.render();
  };
  key("ArrowDown");
  key("Enter", true);
  assert.equal(prevented, 0);
  key("Enter");
  key(" ");
  assert.equal(prevented, 2);
  assert.equal(h.find("story-end-action").props.children, "閉じる");
  key(" ");
  assert.deepEqual(h.counts(), { read: 1, closed: 1 });
});

test("art viewing pauses progression and returning preserves the continuation cue", () => {
  const advanceRef = { current: null },
    h = harness({ advanceRef }, { withArt: true });
  assert.ok(h.find("story-reader story-reader-art"));
  h.find("StoryArtwork").props.onClick();
  h.render();
  assert.deepEqual(h.find("ArtViewer").props.art, fixtureArt);
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 1);
  advanceRef.current.advance();
  h.render();
  assert.equal(h.find("StoryLines").props.lines.length, 1);
  h.find("ArtViewer").props.onClose();
  h.render();
  h.click();
  assert.equal(h.find("StoryLines").props.lines.length, 2);
  assert.equal(h.find("story-continue").props.children, "▼");
});

test("outside advancement shares final readiness and completion guards with dialogue clicks", () => {
  const advanceRef = { current: null },
    h = harness({ advanceRef, ready: false });
  const outside = () => {
    advanceRef.current.advance();
    h.render();
  };
  outside();
  assert.equal(h.find("StoryLines").props.lines.length, 2);
  h.click();
  outside();
  assert.deepEqual(h.counts(), { read: 0, closed: 0 });
  h.render({ ...h.props, ready: true });
  outside();
  outside();
  h.click();
  assert.deepEqual(h.counts(), { read: 1, closed: 1 });
});

test("story dialog reserves the lower half from the first line, independently of artwork and history length", () => {
  const css = compactCss(readFileSync(new URL("../app/stories.css", import.meta.url), "utf8"));
  const dialog = css.match(/\.phone-dialog:has\(>\.story-reader\)\{([^}]+)\}/)[1];
  for (const declaration of [
    "top:auto",
    "width:auto!important",
    "margin:0 auto",
    "translate:none",
    "transform:none",
    "animation:none",
    "max-height:var(--story-dialog-height)",
    "overflow:hidden",
  ])
    assert.ok(dialog.includes(declaration), declaration);
  assert.ok(dialog.includes("env(safe-area-inset-left,0px)"));
  assert.ok(dialog.includes("env(safe-area-inset-right,0px)"));
  assert.ok(dialog.includes("var(--game-height,100dvh)"));
  assert.ok(dialog.includes("height:var(--story-dialog-height)"));
  assert.ok(dialog.includes("--story-conversation-height:calc(var(--story-dialog-height) / 2)"));
  assert.ok(dialog.includes("background:transparent!important"));
  assert.match(
    css,
    /\.phone-dialog>\.story-reader\{[^}]*grid-template-rows:minmax\(0,1fr\) var\(--story-conversation-height\)/,
  );
  assert.doesNotMatch(css, /\.phone-dialog:has\(>\.story-reader-art\)/);
  assert.match(
    css,
    /\.dialogue-history\{[^}]*min-height:0;[^}]*overflow-y:auto;overscroll-behavior:contain/,
  );
  assert.match(css, /\.story-tap-hint\{[^}]*flex:none/);
});

test("the upper artwork slot stays present before and after an illustration appears", () => {
  for (const withArt of [false, true]) {
    const h = harness({}, { withArt });
    for (let page = 0; page < story.lines.length; page++) {
      assert.ok(h.find("story-art-space"));
      assert.equal(!!h.find("figure"), withArt);
      assert.equal(
        h.find("story-conversation").props.children[0].props.className,
        "dialogue-page dialogue-history",
      );
      h.click();
    }
  }
});
