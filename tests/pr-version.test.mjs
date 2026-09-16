import test from "node:test";
import assert from "node:assert/strict";
import {
  CHANGELOG_PATH,
  classifyVersionChange,
  parseVersion,
  validateChangelogUpdate,
  validatePackageLock,
  validateVersionChange,
  wantsMinorRelease,
} from "../scripts/check-pr-version.mjs";

test("PR body must select exactly one version classification", () => {
  assert.equal(
    classifyVersionChange(
      "- [x] `game-change` — ゲーム本体が変わる\n- [ ] `no-game-change` — 据え置き",
    ),
    "game-change",
  );
  assert.equal(
    classifyVersionChange(
      "- [ ] `game-change` — ゲーム本体が変わる\n- [X] `no-game-change` — 据え置き",
    ),
    "no-game-change",
  );
  assert.throws(
    () => classifyVersionChange("- [ ] `game-change`\n- [ ] `no-game-change`"),
    /どちらか一方/,
  );
  assert.throws(
    () => classifyVersionChange("- [x] `game-change`\n- [x] `no-game-change`"),
    /どちらか一方/,
  );
});

test("game changes increment only the patch version once", () => {
  assert.equal(validateVersionChange("1.4.9", "1.4.10", "game-change"), "1.4.10");
  assert.throws(() => validateVersionChange("1.4.9", "1.4.9", "game-change"), /期待値: 1\.4\.10/);
  assert.throws(() => validateVersionChange("1.4.9", "1.5.0", "game-change"), /期待値: 1\.4\.10/);
});

test("non-game changes keep the version unchanged", () => {
  assert.equal(validateVersionChange("0.1.2", "0.1.2", "no-game-change"), "0.1.2");
  assert.throws(() => validateVersionChange("0.1.2", "0.1.3", "no-game-change"), /期待値: 0\.1\.2/);
});

test("a minor release is opt-in and only reachable through the PR body", () => {
  assert.equal(wantsMinorRelease("- [x] `game-change`\n- [x] `minor-release` — 章の区切り"), true);
  assert.equal(wantsMinorRelease("- [ ] `minor-release` — 章の区切り"), false);
  assert.equal(wantsMinorRelease("`minor-release` の説明を本文で触れただけ"), false);
  assert.equal(wantsMinorRelease(undefined), false);
});

test("a marked minor release raises the minor version and resets the patch", () => {
  assert.equal(validateVersionChange("0.2.13", "0.3.0", "game-change", true), "0.3.0");
  assert.equal(validateVersionChange("0.1.22", "0.2.0", "no-game-change", true), "0.2.0");
  assert.throws(
    () => validateVersionChange("0.2.13", "0.2.14", "game-change", true),
    /期待値: 0\.3\.0/,
  );
  assert.throws(
    () => validateVersionChange("0.2.13", "1.0.0", "game-change", true),
    /期待値: 0\.3\.0/,
  );
});

test("without the marker a minor bump is rejected under the normal policy", () => {
  assert.throws(() => validateVersionChange("0.2.0", "0.3.0", "game-change"), /期待値: 0\.2\.1/);
  assert.throws(
    () => validateVersionChange("0.1.22", "0.2.0", "game-change", false),
    /期待値: 0\.1\.23/,
  );
  assert.throws(
    () => validateVersionChange("0.1.22", "0.2.0", "no-game-change"),
    /期待値: 0\.1\.22/,
  );
  assert.equal(validateVersionChange("0.2.0", "0.2.1", "game-change"), "0.2.1");
  assert.equal(validateVersionChange("0.2.0", "0.2.0", "no-game-change"), "0.2.0");
});

test("a version bump has to bring a changelog line with it", () => {
  assert.equal(validateChangelogUpdate("0.2.13", "0.2.13", []), false);
  assert.equal(validateChangelogUpdate("0.2.13", "0.2.14", [CHANGELOG_PATH, "lib/game.ts"]), true);
  assert.equal(validateChangelogUpdate("0.2.13", "0.3.0", [CHANGELOG_PATH]), true);
  assert.throws(
    () => validateChangelogUpdate("0.2.13", "0.2.14", ["lib/game.ts", "package.json"]),
    /CHANGELOG\.md へ 0\.2\.14 の行を追加/,
  );
});

test("versions and lockfile copies stay valid and synchronized", () => {
  assert.deepEqual(parseVersion("12.3.45"), { major: 12, minor: 3, patch: 45 });
  assert.throws(() => parseVersion("1.2"), /x\.y\.z/);
  assert.doesNotThrow(() =>
    validatePackageLock("0.1.2", { version: "0.1.2", packages: { "": { version: "0.1.2" } } }),
  );
  assert.throws(
    () =>
      validatePackageLock("0.1.2", { version: "0.1.3", packages: { "": { version: "0.1.2" } } }),
    /一致していません/,
  );
});
