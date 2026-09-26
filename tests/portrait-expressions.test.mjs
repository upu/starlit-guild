import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import sharp from "sharp";
import * as jsxRuntime from "react/jsx-runtime";
import * as portraits from "../lib/portrait-expressions.ts";
import * as originals from "../lib/original-characters.ts";
import { stories } from "../lib/stories.ts";
import { idleBanter } from "../lib/idle-banter.ts";

const code = ts.transpileModule(
  readFileSync(new URL("../app/portrait.tsx", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
const exports = {};
const modules = {
  "react/jsx-runtime": jsxRuntime,
  "@/lib/original-characters": originals,
  "@/lib/portrait-expressions": portraits,
};
vm.runInNewContext(code, {
  exports,
  require: (id) => {
    assert.ok(id in modules);
    return modules[id];
  },
});

test("reference characters retain eight expressions and other characters retain their art", async () => {
  for (const [index, name] of [
    [0, "aria"],
    [1, "leon"],
    [2, "mira"],
    [13, "pumpety"],
  ]) {
    const positions = new Set();
    for (const expression of portraits.portraitExpressions) {
      const portrait = exports.Portrait({ index, expression, size: 72 });
      assert.equal(
        portrait.props.style.backgroundImage,
        index < 2
          ? "url(/portraits/aria-leon-expressions-v2.webp)"
          : `url(/portraits/${name}-expressions.webp)`,
      );
      assert.equal(portrait.props.style.backgroundSize, index < 2 ? "400% 400%" : "400% 200%");
      positions.add(portrait.props.style.backgroundPosition);
    }
    assert.equal(positions.size, 8);
    const meta = await sharp(
      readFileSync(new URL(`../public/portraits/${name}-expressions.webp`, import.meta.url)),
    ).metadata();
    assert.equal(meta.width, 1024);
    assert.equal(meta.height, 512);
    assert.equal(
      exports.Portrait({ index }).props.style.backgroundPosition,
      portraits.expressionPortrait(index, "neutral").position,
    );
  }
  assert.equal(portraits.expressionPortrait(4, "smile")?.src, "/portraits/lico-expressions.webp");
  for (const index of [5, 6, 7, 14]) {
    assert.equal(portraits.expressionPortrait(index, "smile"), null);
    assert.ok(
      exports
        .Portrait({ index, expression: "smile" })
        .props.style.backgroundImage.includes("dialogue-atlas"),
    );
  }
});

test("expressions are authored for narrative context, narration has none, and unspecified lines stay neutral", () => {
  for (const story of stories)
    for (const line of story.lines) {
      if (!line.speaker) assert.equal(line.expression, undefined);
      if (line.expression)
        assert.ok(
          portraits.portraitExpressions.includes(line.expression),
          `${story.id}: ${line.expression}`,
        );
    }
  assert.ok(idleBanter(0).every((l) => l.expression === "smile"));
  assert.equal(
    portraits.expressionPortrait(0).position,
    portraits.expressionPortrait(0, "neutral").position,
  );
});

test("chat and story sizes share close-ups with distinct speakers and expressions", async () => {
  const positions = new Set();
  for (const index of [0, 1]) {
    for (const expression of portraits.portraitExpressions.slice(0, 8)) {
      const compact = exports.Portrait({ index, expression, size: 40 });
      assert.equal(
        compact.props.style.backgroundImage,
        "url(/portraits/aria-leon-expressions-v2.webp)",
      );
      assert.equal(compact.props.style.backgroundSize, "400% 400%");
      positions.add(compact.props.style.backgroundPosition);
      assert.equal(
        exports.Portrait({ index, expression }).props.style.backgroundImage,
        compact.props.style.backgroundImage,
      );
    }
    assert.deepEqual(
      portraits.expressionPortrait(index, "thoughtful"),
      portraits.expressionPortrait(index, "neutral"),
    );
  }
  assert.equal(positions.size, 16);
  assert.equal(portraits.expressionPortrait(0).position, "0% 0%");
  assert.equal(portraits.expressionPortrait(1, "mischievous").position, "100% 100%");
  for (const index of [2, 13, 3])
    assert.deepEqual(
      exports.Portrait({ index, size: 40 }).props.style.backgroundImage,
      exports.Portrait({ index, size: 72 }).props.style.backgroundImage,
    );
  const meta = await sharp(
    readFileSync(new URL("../public/portraits/aria-leon-expressions-v2.webp", import.meta.url)),
  ).metadata();
  assert.equal(meta.width, meta.height);
  assert.ok(meta.width >= 1024);
});

test("Finn uses nine cells through the shared API; eight-cell characters fall back safely", async () => {
  const expected = [
    "0% 0%",
    "50% 0%",
    "100% 0%",
    "0% 50%",
    "50% 50%",
    "100% 50%",
    "0% 100%",
    "50% 100%",
    "100% 100%",
  ];
  for (const [cell, expression] of portraits.portraitExpressions.slice(0, 9).entries()) {
    assert.deepEqual(portraits.expressionPortrait("finn", expression), {
      src: "/portraits/finn-expressions.webp",
      size: "300% 300%",
      position: expected[cell],
    });
  }
  const meta = await sharp(
    readFileSync(new URL("../public/portraits/finn-expressions.webp", import.meta.url)),
  ).metadata();
  assert.equal(meta.width, 768);
  assert.equal(meta.height, 768);
  for (const character of ["aria", "leon", "mira", "pumpety", 0, 1, 2, 13]) {
    assert.deepEqual(
      portraits.expressionPortrait(character, "thoughtful"),
      portraits.expressionPortrait(character),
    );
  }
});

test("Lico's grin and discovery shout render distinct cells at chat and dialogue sizes", async () => {
  for (const size of [40, 72]) {
    const positions = new Set();
    for (const expression of portraits.portraitAtlases.lico.expressions) {
      const face = exports.Portrait({ index: "lico", expression, size });
      assert.equal(face.props.style.backgroundImage, "url(/portraits/lico-expressions.webp)");
      assert.equal(face.props.style.backgroundSize, "300% 300%");
      assert.equal(face.props.style.width, size);
      positions.add(face.props.style.backgroundPosition);
    }
    assert.equal(positions.size, 9);
  }
  assert.equal(portraits.expressionPortrait("lico", "mischievous").position, "50% 100%");
  assert.equal(portraits.expressionPortrait("lico", "shouting").position, "100% 100%");
  assert.equal(portraits.expressionPortrait("lico", "surprised").position, "100% 0%");
  assert.deepEqual(
    portraits.expressionPortrait("lico", "thoughtful"),
    portraits.expressionPortrait("lico"),
  );
  for (const character of ["aria", "leon", "mira", "pumpety", "finn"])
    assert.deepEqual(
      portraits.expressionPortrait(character, "shouting"),
      portraits.expressionPortrait(character),
    );
  const meta = await sharp(
    readFileSync(new URL("../public/portraits/lico-expressions.webp", import.meta.url)),
  ).metadata();
  assert.equal(meta.width, 768);
  assert.equal(meta.height, 768);
});

test("Merrill's appetite expressions share the atlas through named and legacy portrait calls", async () => {
  const expected = [
    ["neutral", "0% 0%"],
    ["smile", "33.33333333333333% 0%"],
    ["surprised", "66.66666666666666% 0%"],
    ["mischievous", "100% 0%"],
    ["savoring", "0% 100%"],
    ["excited", "33.33333333333333% 100%"],
    ["serious", "66.66666666666666% 100%"],
    ["predatory", "100% 100%"],
  ];
  for (const [expression, position] of expected) {
    for (const index of ["merrill", 12]) {
      assert.deepEqual(portraits.expressionPortrait(index, expression), {
        src: "/portraits/merrill-expressions.webp",
        size: "400% 200%",
        position,
      });
      for (const size of [40, 72]) {
        const face = exports.Portrait({ index, expression, size });
        assert.equal(face.props.style.backgroundImage, "url(/portraits/merrill-expressions.webp)");
        assert.equal(face.props.style.backgroundPosition, position);
        assert.equal(face.props.style.backgroundSize, "400% 200%");
        assert.equal(face.props.style.width, size);
      }
    }
  }
  for (const expression of ["worried", "shy", "tired", "thoughtful", "shouting"])
    assert.deepEqual(
      portraits.expressionPortrait("merrill", expression),
      portraits.expressionPortrait("merrill"),
    );
  for (const character of ["aria", "leon", "mira", "pumpety", "finn", "lico"])
    for (const expression of ["predatory", "savoring", "excited"])
      assert.deepEqual(
        portraits.expressionPortrait(character, expression),
        portraits.expressionPortrait(character),
      );
  const meta = await sharp(
    readFileSync(new URL("../public/portraits/merrill-expressions.webp", import.meta.url)),
  ).metadata();
  assert.equal(meta.width, 1024);
  assert.equal(meta.height, 512);
});

test("authored story expressions exist for the speaker instead of silently falling back", () => {
  for (const story of stories)
    for (const line of story.lines) {
      const atlas = portraits.portraitAtlases[line.speaker];
      if (atlas && line.expression)
        assert.ok(
          atlas.expressions.includes(line.expression),
          `${story.id}: ${line.speaker} / ${line.expression}`,
        );
    }
});

test("key emotional moments keep shouting, fatigue, embarrassment and appetite distinct", () => {
  const examples = [
    ["brekka-moss-beds-return", "あーーっ！", "shouting"],
    ["merrill-seedlings-departure", "あーーっ！　それ、移す分！", "shouting"],
    ["glowing-moss-trail-departure", "私は、まだ大丈夫よ。", "tired"],
    ["glowing-moss-trail-departure", "付き添いまでしていただかなくても……。", "shy"],
    ["glowing-moss-trail-return", "……もう、行った。", "shy"],
    ["moonlit-herbs-return", "私は、まだ大丈夫よ。あと一人分、包めば――", "tired"],
    ["waiting-households-return", "では、少しだけ……", "tired"],
    ["sweet-blockade-return", "……それは、私の台詞よ。", "shy"],
    ["moss-transplant-return", "……ありがとう。では、お願いするわ。", "shy"],
    ["merrill-seedlings-departure", "……エルフの人、久しぶりに見た。あなたの耳は？", "predatory"],
  ];
  for (const [id, text, expression] of examples) {
    const line = stories.find((story) => story.id === id)?.lines.find((line) => line.text === text);
    assert.ok(line, `${id}: ${text}`);
    assert.equal(line.expression, expression, `${id}: ${text}`);
    assert.notEqual(
      portraits.expressionPortrait(line.speaker, expression).position,
      portraits.expressionPortrait(line.speaker, "neutral").position,
    );
  }
});
