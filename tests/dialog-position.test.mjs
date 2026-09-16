import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../components/ui/dialog.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  reportDiagnostics: true,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
});
const jsx = (type, props, key) => ({ type, props, key });
const exports = {};
const modules = {
  react: {},
  "react/jsx-runtime": { jsx, jsxs: jsx },
  "lucide-react": { XIcon: "icon" },
  "radix-ui": { Dialog: { Content: "content", Close: "close" } },
  "@/lib/utils": { cn: (...values) => values.filter(Boolean).join(" ") },
  "@/components/ui/button": { Button: "button" },
};
vm.runInNewContext(compiled.outputText, {
  exports,
  require: (id) => {
    assert.ok(id in modules, id);
    return modules[id];
  },
});
const nodes = (node) =>
  !node || typeof node !== "object"
    ? []
    : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
const render = (props) => nodes(exports.DialogContent(props));

test("dialog content TSX has no syntax diagnostics", () => {
  assert.deepEqual(
    compiled.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error),
    [],
  );
});

test("ordinary and story dialogs have no translated or zoomed centering to leak into anchored layouts", () => {
  for (const className of [undefined, "phone-dialog", "phone-dialog story-dialog", "save-dialog"]) {
    const content = render({ className }).find((node) => node.type === "content");
    const classes = content.props.className.split(/\s+/);
    for (const name of ["fixed", "inset-0", "m-auto", "h-fit", "w-full"])
      assert.ok(classes.includes(name), name);
    assert.ok(
      !classes.some((name) => /translate|zoom|top-\[50%\]|left-\[50%\]/.test(name)),
      classes.join(" "),
    );
    if (className) assert.ok(content.props.className.endsWith(className));
  }
});

test("full-screen artwork keeps its edge-to-edge frame without content-sized height or centering margins", () => {
  const content = render({
    fullScreen: true,
    className: "art-viewer",
    showCloseButton: false,
  }).find((node) => node.type === "content");
  assert.equal(content.props.className, "fixed inset-0 z-50 outline-none art-viewer");
});

test("close controls, event handlers, accessibility props and children are preserved", () => {
  const child = { type: "story-reader", props: {} },
    onEscapeKeyDown = () => {};
  const props = { children: child, onEscapeKeyDown, "aria-label": "会話", closeLabel: "戻る" };
  const ordinary = render(props),
    content = ordinary.find((node) => node.type === "content");
  assert.equal(content.props.onEscapeKeyDown, onEscapeKeyDown);
  assert.equal(content.props["aria-label"], "会話");
  assert.ok(ordinary.includes(child));
  assert.ok(ordinary.some((node) => node.type === "close"));
  assert.ok(ordinary.some((node) => node.type === "span" && node.props.children === "戻る"));
  assert.ok(!render({ ...props, showCloseButton: false }).some((node) => node.type === "close"));
});
