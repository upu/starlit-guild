import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageInfo = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const startScreen = readFileSync(new URL("../app/start-screen.tsx", import.meta.url), "utf8");

test("start screen shows the package version", () => {
  assert.match(packageInfo.version, /^\d+\.\d+\.\d+$/);
  assert.match(startScreen, /import \{ ?APP_VERSION ?\} from ["']\.\/app-version["'];/);
  assert.match(startScreen, /<span className="start-version">v\{APP_VERSION\}<\/span>/);
});
