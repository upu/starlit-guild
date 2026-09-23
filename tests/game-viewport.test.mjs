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
const dialogShellCss = compactCss(
  readFileSync(new URL("../app/dialog-shell.css", import.meta.url), "utf8"),
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

test("bottom navigation is fixed to the viewport and reserves its layout space", () => {
  assert.match(phoneNavigationCss, /--game-nav-height:calc\(56px \+ var\(--game-safe-bottom\)\)/);
  assert.match(
    phoneNavigationCss,
    /\.phone-game \.phone-tabs\{padding-bottom:var\(--game-nav-height\)\}/,
  );
  assert.match(
    phoneNavigationCss,
    /\.phone-game \.phone-navigation\{[^}]*position:fixed;[^}]*bottom:0;[^}]*height:var\(--game-nav-height\)!important;[^}]*padding:[^}]*calc\(2px \+ var\(--game-safe-bottom\)\)/,
  );
  assert.match(
    phoneNavigationCss,
    /@media\(min-width:760px\)\{\s*:root\{--game-nav-height:calc\(64px \+ var\(--game-safe-bottom\)\)\}/,
  );
});

test("shared shells load after screen-specific styles, with dialog space tied to the game viewport", () => {
  assert.ok(
    layoutSource.indexOf('import "./adventure-chat.css"') <
      layoutSource.indexOf('import "./phone-navigation.css"'),
  );
  assert.ok(
    layoutSource.indexOf('import "./phone-navigation.css"') <
      layoutSource.indexOf('import "./dialog-shell.css"'),
  );
  assert.match(
    dialogShellCss,
    /\.phone-dialog,\.save-dialog\{[^}]*max-height:calc\(var\(--game-height,100dvh\) - 24px - env\(safe-area-inset-top\) - var\(--game-safe-bottom\)\)/,
  );
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
