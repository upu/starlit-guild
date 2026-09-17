import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const panels = readFileSync(new URL("../app/equipment-panels.tsx", import.meta.url), "utf8");
const source = ts.createSourceFile(
  "equipment-panels.tsx",
  panels,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const resources = source.statements.find(
  (node) => ts.isFunctionDeclaration(node) && node.name?.text === "ResourcesGrid",
);
const formatter = source.statements.find(
  (node) =>
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(
      (declaration) => declaration.name.getText(source) === "amount",
    ),
);
assert.ok(resources && formatter);
const compiled = ts.transpileModule(`${formatter.getText(source)}\n${resources.getText(source)}`, {
  fileName: "inventory.tsx",
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    jsxFactory: "element",
  },
}).outputText;
const exports = {};
runInNewContext(compiled, {
  exports,
  element: (type, props, ...children) => ({ type, props, children: children.flat(Infinity) }),
  Coins: "coins",
  Leaf: "leaf",
  Gem: "gem",
});
function balances(state) {
  const content = exports.ResourcesGrid({ state });
  assert.equal(content.type, "div");
  assert.equal(content.props.className, "inventory-grid");
  assert.equal(content.children.length, 3);
  return Array.from(content.children, (cell) => ({
    icon: cell.children[0].type,
    label: cell.children[1].children.join(""),
    amount: cell.children[2].children.join(""),
  }));
}
test("bag keeps all normal resources with the existing formatting", () => {
  const state = Object.freeze({ prologue: true, gold: 12345.9, herbs: 8.7, ore: 3 });
  assert.deepEqual(balances(state), [
    { icon: "coins", label: "お金", amount: "12,345" },
    { icon: "leaf", label: "薬草", amount: "8" },
    { icon: "gem", label: "鉱石", amount: "3" },
  ]);
});

test("empty inventory keeps every resource counter visible", () => {
  assert.deepEqual(
    balances({ prologue: true, gold: 0, herbs: 0, ore: 0 }).map((item) => item.amount),
    ["0", "0", "0"],
  );
});

test("reading balances never changes the save", () => {
  const state = {
    prologue: true,
    gold: 180,
    herbs: 80,
    ore: 5,
    owned: ["aria", "leon", "mira"],
    done: { "village-trade": 12 },
  };
  const before = structuredClone(state);
  balances(state);
  assert.deepEqual(state, before);
});
