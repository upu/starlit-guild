import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const begin = "<!-- manual-test-inventory:start -->";
const end = "<!-- manual-test-inventory:end -->";
const manualTest = /\.(?:browser\.mjs|browser\.py|integration\.mjs|balance\.mjs)$/;

export function documentedTests(markdown) {
  const start = markdown.indexOf(begin);
  const stop = markdown.indexOf(end);
  if (start < 0 || stop <= start || markdown.indexOf(begin, start + begin.length) >= 0)
    throw new Error("Manual test inventory markers are missing or duplicated");
  const table = markdown.slice(start + begin.length, stop);
  const entries = [...table.matchAll(/^\|\s*`(tests\/[^`]+)`[^|]*\|/gm)].map((match) => match[1]);
  if (entries.length === 0 || entries.some((entry) => !manualTest.test(entry)))
    throw new Error("Manual test inventory contains no tests or an unsupported test path");
  return entries;
}

export function inventoryErrors(actual, documented) {
  const errors = [];
  const listed = new Set(documented);
  const found = new Set(actual);
  for (const path of documented) {
    if (documented.filter((entry) => entry === path).length > 1)
      errors.push(`Duplicate inventory entry: ${path}`);
  }
  for (const path of actual) if (!listed.has(path)) errors.push(`Missing from inventory: ${path}`);
  for (const path of documented)
    if (!found.has(path)) errors.push(`No matching test file: ${path}`);
  return [...new Set(errors)];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(import.meta.dirname, "..");
  const actual = readdirSync(resolve(root, "tests"))
    .filter((name) => manualTest.test(name))
    .map((name) => `tests/${name}`);
  const documented = documentedTests(
    readFileSync(resolve(root, "docs/development/development.md"), "utf8"),
  );
  const errors = inventoryErrors(actual, documented);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Manual test inventory: ${actual.length} files documented`);
  }
}
