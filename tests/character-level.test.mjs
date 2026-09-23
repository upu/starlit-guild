import { test } from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import { levelProgress } from "../lib/game.ts";

const { CharacterLevel } = evaluateSourceModule(
  compileSourceModule("../app/character-level.tsx", import.meta.url),
  { "react/jsx-runtime": jsxRuntime, "@/lib/game": { levelProgress } },
);
const render = (xp) => renderToStaticMarkup(jsxRuntime.jsx(CharacterLevel, { xp }));

test("character level shows total EXP, the next level and a gauge", () => {
  const html = render(3850);
  assert.match(html, /Lv\. 12<\/span>/);
  assert.match(html, /EXP 3,850 \/ 4,320/);
  assert.match(html, /次のLvまで 470/);
  assert.match(html, /<progress max="1" value="0\.31\d*" aria-label="次のレベルまで 31%"/);
  assert.doesNotMatch(html, /MAX/);
});

test("character level at the cap shows MAX without a next level or gauge", () => {
  const html = render(72030);
  assert.match(html, /Lv\. 50<b>MAX<\/b>/);
  assert.match(html, /EXP 72,030<\/p>/);
  assert.doesNotMatch(html, /次のLv|<progress/);
});
