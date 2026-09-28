import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const major = (range) => Number(/\d+/.exec(range)?.[0]);

// Dependabot only raises @types/node, so its major-version PR is the signal to raise Node itself.
test("@types/node のメジャー版は devEngines の Node と一致する", () => {
  const runtime = pkg.devEngines?.runtime;
  assert.equal(
    runtime?.name,
    "node",
    "package.json の devEngines.runtime に Node の版がありません",
  );
  const node = major(runtime.version);
  const types = major(pkg.devDependencies["@types/node"]);
  assert.equal(
    types,
    node,
    `@types/node は ${types} 系、Node は ${node} 系です。` +
      `Node を ${types} 系へ上げる場合は同じPRで devEngines.runtime.version も更新してください。` +
      "上げない場合は @types/node を戻してください。",
  );
});
