import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateSourceModule } from "./helpers/source-module.mjs";

test("unregistered test dependencies fail instead of receiving a placeholder", () => {
  const compiled = { code: 'require("missing")', filename: "fixture.tsx" };
  assert.throws(
    () => evaluateSourceModule(compiled, {}),
    /Unregistered test dependency "missing" in fixture\.tsx/,
  );
  assert.throws(
    () => evaluateSourceModule(compiled, Object.create({ missing: {} })),
    /Unregistered test dependency "missing" in fixture\.tsx/,
  );
});
