import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gameViewportHeight } from "../app/use-game-viewport.ts";
import { compactCss } from "./compact-css.mjs";

const navigationCss = compactCss(
  readFileSync(new URL("../app/navigation.css", import.meta.url), "utf8"),
);
const phoneNavigationCss = compactCss(
  readFileSync(new URL("../app/phone-navigation.css", import.meta.url), "utf8"),
);
const layoutSource = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const manifest = JSON.parse(
  readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
);

test("normal view leaves sizing to CSS dynamic viewport units", () => {
  assert.equal(gameViewportHeight(844, 810, false), undefined);
});

test("software keyboard uses the reduced visual viewport", () => {
  assert.equal(gameViewportHeight(844, 510, true), 510);
});

test("keyboard fallback uses the window height without Visual Viewport API", () => {
  assert.equal(gameViewportHeight(844, undefined, true), 844);
});

test("browser-owned bottom area uses the navigation color", () => {
  assert.equal(manifest.background_color, "#102a26");
  assert.equal(manifest.theme_color, "#102a26");
  assert.match(layoutSource, /themeColor: ?["']#102a26["']/);
  assert.match(navigationCss, /html\{background:var\(--game-nav-color\)\}/);
});

test("installed iOS layout avoids the viewport-fit cover height bug", () => {
  assert.doesNotMatch(layoutSource, /viewportFit/);
  assert.match(layoutSource, /statusBarStyle: ?["']default["']/);
  assert.doesNotMatch(phoneNavigationCss, /@media\(display-mode:standalone\).*--game-height:100vh/);
  assert.doesNotMatch(navigationCss, /body\{position:fixed/);
});

test("bottom navigation tabs ignore long-press selection and sticky hover", () => {
  const trigger = '.phone-navigation [data-slot="tabs-trigger"]';
  const rule = phoneNavigationCss.slice(phoneNavigationCss.indexOf(`${trigger}{`));
  assert.match(rule, /^[^}]*-webkit-touch-callout:none/);
  assert.match(rule, /^[^}]*-webkit-user-select:none;user-select:none/);
  assert.match(rule, /^[^}]*-webkit-tap-highlight-color:transparent/);
});

test("gold button hover stays off touch screens and buttons with their own background", () => {
  const globalsCss = compactCss(
    readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"),
  );
  assert.match(
    globalsCss,
    /@media\(hover:hover\)\{button:where\(:not\(:disabled\):hover\),\.button:where\(:hover\)\{background:#e3c789\}\}/,
  );
  assert.doesNotMatch(globalsCss, /(^|[}\s,])button:hover/);
});
