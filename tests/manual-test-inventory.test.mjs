import assert from "node:assert/strict";
import test from "node:test";
import { documentedTests, inventoryErrors } from "../scripts/check-manual-test-inventory.mjs";

test("manual test inventory catches additions, removals, and duplicates", () => {
  const actual = ["tests/a.browser.mjs", "tests/b.integration.mjs"];
  const documented = documentedTests(`
<!-- manual-test-inventory:start -->
| テスト | 実行 |
| --- | --- |
| \`tests/a.browser.mjs\` | node tests/a.browser.mjs |
| \`tests/gone.browser.py\` | python tests/gone.browser.py |
| \`tests/a.browser.mjs\` | node tests/a.browser.mjs |
<!-- manual-test-inventory:end -->`);
  assert.deepEqual(inventoryErrors(actual, documented), [
    "Duplicate inventory entry: tests/a.browser.mjs",
    "Missing from inventory: tests/b.integration.mjs",
    "No matching test file: tests/gone.browser.py",
  ]);
});

test("manual test inventory requires its bounded table", () => {
  assert.throws(() => documentedTests("| `tests/a.browser.mjs` |"), /markers/);
});
