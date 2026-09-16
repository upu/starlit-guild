import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  targets,
  checkTargets,
  checkManifest,
} from "./check-site-release.mjs";

const target = process.env.SITE_TARGET;
const sourceCommit = process.env.SOURCE_COMMIT;
assert.ok(["preview", "production"].includes(target), "SITE_TARGET must be preview or production");
assert.ok(sourceCommit, "SOURCE_COMMIT is required");

// A delivery checkout may have staged changes after restoring the source tree.
// Compare its working files directly with the selected GitHub source commit.
assert.match(sourceCommit, /^[a-f0-9]{40}$/, "Use a full source commit SHA");
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
assert.equal(git("rev-parse", `${sourceCommit}^{commit}`), sourceCommit);
assert.equal(git("ls-files", "--others", "--exclude-standard"), "", "Delivery checkout has untracked files");
const changed = git("diff", "--name-only", sourceCommit).split("\n").filter(Boolean);
assert.ok(changed.every((path) => path === ".openai/hosting.json"), "Delivery source differs beyond the target manifest");
const canonical = JSON.parse(git("show", `${sourceCommit}:.openai/hosting.json`));
checkTargets(targets, canonical);
const manifest = { ...canonical, project_id: targets[target].projectId };
checkManifest(manifest, canonical, targets[target].projectId);
writeFileSync(resolve(".openai/hosting.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${target} manifest for ${sourceCommit}`);
