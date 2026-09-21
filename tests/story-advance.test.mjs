import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

const source = readFileSync(new URL("../app/use-story-advance.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

test("outside primary clicks advance once and suppress dismissal; context clicks never advance", () => {
  const exports = {};
  vm.runInNewContext(code, { exports, require: () => ({ useRef: () => ({ current: null }) }) });
  const { readerRef, onPointerDownOutside } = exports.useStoryAdvance();
  let advanced = 0,
    prevented = 0;
  const click = (button = 0, ctrlKey = false) =>
    onPointerDownOutside({
      preventDefault() {
        prevented++;
      },
      detail: { originalEvent: { button, ctrlKey } },
    });
  click();
  assert.equal(advanced, 0, "no reader is a safe no-op");
  readerRef.current = {
    advance() {
      advanced++;
    },
  };
  click();
  click();
  assert.equal(advanced, 2);
  click(2);
  click(1);
  click(0, true);
  assert.equal(advanced, 2);
  assert.equal(prevented, 6);
});

test("story dialogs wire outside clicks to their reader; ordinary sheets do not", () => {
  const exports = {},
    readerRef = { current: null },
    onPointerDownOutside = () => {};
  const modules = {
    react: {},
    "react/jsx-runtime": jsxRuntime,
    "./use-story-advance": { useStoryAdvance: () => ({ readerRef, onPointerDownOutside }) },
    "./story-scenes": { StoryReader: "reader" },
    "./story-heading": { StoryHeading: "story-heading" },
    "./phone-game-sheets": {
      resolveSheet: (model, advanceRef) => ({
        title: "test",
        description: "test",
        content: model.sheet ? jsxRuntime.jsx("reader", { advanceRef }) : null,
      }),
    },
    "@/components/ui/dialog": {
      Dialog: "dialog",
      DialogContent: "content",
      DialogHeader: "header",
      DialogTitle: "title",
      DialogDescription: "description",
    },
  };
  const phoneSource = readFileSync(new URL("../app/phone-game-frame.tsx", import.meta.url), "utf8");
  const phoneCode = ts.transpileModule(phoneSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(phoneCode, {
    exports,
    require: (id) => modules[id] ?? {},
  });
  for (const sheet of ["story", null]) {
    const model = {
      sheet,
      reading: { id: "test", title: "test", place: "test" },
      setSheet() {
        throw Error("outside click must not close the conversation");
      },
    };
    const dialog = exports.SheetDialog({ model }),
      content = dialog.props.children;
    assert.equal(content.props.onPointerDownOutside, sheet ? onPointerDownOutside : undefined);
    let prevented = false;
    content.props.onInteractOutside({
      preventDefault() {
        prevented = true;
      },
    });
    assert.equal(prevented, !!sheet);
    if (sheet) {
      assert.equal(content.props.children[1].props.advanceRef, readerRef);
      assert.equal(content.props.children[0].type, "story-heading");
      assert.equal(content.props.children[0].props.readerRef, readerRef);
    } else assert.equal(content.props.children[0].type, "header");
  }
});

test("the separate story heading forwards primary and keyboard clicks to the current reader", () => {
  const exports = {},
    readerRef = { current: null };
  let advanced = 0,
    prevented = 0;
  const headingCode = ts.transpileModule(
    readFileSync(new URL("../app/story-heading.tsx", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  vm.runInNewContext(headingCode, {
    exports,
    require: (id) =>
      id === "react/jsx-runtime"
        ? jsxRuntime
        : { DialogHeader: "header", DialogTitle: "title", DialogDescription: "description" },
  });
  const button = exports.StoryHeading({ title: "出発の朝", description: "村", readerRef }).props
    .children;
  const click = (buttonNumber = 0, ctrlKey = false) =>
    button.props.onClick({ button: buttonNumber, ctrlKey });
  click();
  assert.equal(advanced, 0);
  readerRef.current = {
    advance() {
      advanced++;
    },
  };
  click();
  click();
  assert.equal(advanced, 2);
  click(2);
  click(1);
  click(0, true);
  assert.equal(advanced, 2);
  for (const key of ["Enter", " "])
    button.props.onKeyDown({
      key,
      repeat: true,
      preventDefault() {
        prevented++;
      },
    });
  assert.equal(prevented, 2);
  button.props.onKeyDown({
    key: "Enter",
    repeat: false,
    preventDefault() {
      prevented++;
    },
  });
  assert.equal(prevented, 2);
  readerRef.current = {
    advance() {
      advanced += 10;
    },
  };
  click();
  assert.equal(advanced, 12);
});
