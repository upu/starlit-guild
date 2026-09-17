import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  targets,
  checkTargets,
  checkManifest,
  checkObservation,
  checkSource,
} from "../scripts/check-site-release.mjs";

const sha = "a".repeat(40),
  canonical = { project_id: targets.production.projectId, d1: "DB", r2: null };
const checker = fileURLToPath(new URL("../scripts/check-site-release.mjs", import.meta.url));
const preparer = fileURLToPath(new URL("../scripts/prepare-site-manifest.mjs", import.meta.url));
const observation = (target = "preview", mode = "test") => ({
  mode,
  site: {
    projectId: targets[target].projectId,
    url: targets[target].url,
    accessMode: target === "preview" ? "custom" : "public",
  },
  environment: {
    projectId: targets[target].projectId,
    revision: 1,
    testTools: mode === "test" ? "true" : null,
  },
  previewVerification: {
    projectId: targets.preview.projectId,
    sourceCommit: sha,
    checkedAt: "2026-09-14T01:00:00Z",
    testMode: {
      status: "passed",
      deploymentId: "test-deploy",
      environmentRevision: 1,
      testTools: true,
    },
    normalMode: {
      status: "passed",
      deploymentId: "normal-deploy",
      environmentRevision: 2,
      testTools: false,
    },
    chapterOne: "passed",
    saveRestore: "passed",
    changedAreas: "passed",
    realDevice: "passed",
  },
});

test("targets keep production canonical and isolate hosts and projects", () => {
  checkTargets(targets, canonical);
  for (const change of [
    { ...targets, preview: targets.production },
    { ...targets, preview: { ...targets.preview, url: targets.production.url } },
  ])
    assert.throws(() => checkTargets(change, canonical));
  assert.throws(() =>
    checkTargets(targets, { ...canonical, project_id: targets.preview.projectId }),
  );
});

test("delivery manifest changes only the destination, preserving database bindings", () => {
  checkManifest(
    { ...canonical, project_id: targets.preview.projectId },
    canonical,
    targets.preview.projectId,
  );
  assert.throws(() => checkManifest(canonical, canonical, targets.preview.projectId));
  assert.throws(() =>
    checkManifest({ ...canonical, d1: null }, canonical, targets.production.projectId),
  );
});

test("preview supports both test and normal verification with restricted access", () => {
  for (const mode of ["test", "normal"])
    checkObservation("preview", sha, observation("preview", mode));
  const publicPreview = observation();
  publicPreview.site.accessMode = "public";
  assert.throws(() => checkObservation("preview", sha, publicPreview));
  for (const value of [undefined, "false", "TRUE", "1", true]) {
    const input = observation();
    input.environment.testTools = value;
    assert.throws(() => checkObservation("preview", sha, input));
  }
});

test("production rejects test mode, wrong target, and incomplete or stale evidence", () => {
  checkObservation("production", sha, observation("production", "normal"));
  const mutations = [
    (o) => {
      o.mode = "test";
      o.environment.testTools = "true";
    },
    (o) => {
      o.site.projectId = targets.preview.projectId;
    },
    (o) => {
      o.site.url = targets.preview.url;
    },
    (o) => {
      o.environment.projectId = targets.preview.projectId;
    },
    (o) => {
      o.previewVerification.sourceCommit = "b".repeat(40);
    },
    (o) => {
      o.previewVerification.projectId = targets.production.projectId;
    },
    (o) => {
      o.previewVerification.normalMode.status = "pending";
    },
    (o) => {
      o.previewVerification.testMode.deploymentId = "";
    },
    (o) => {
      o.previewVerification.chapterOne = "pending";
    },
    (o) => {
      o.previewVerification.realDevice = "failed";
    },
    (o) => {
      o.previewVerification.realDevice = "not-run";
    },
  ];
  for (const mutate of mutations) {
    const input = observation("production", "normal");
    mutate(input);
    assert.throws(() => checkObservation("production", sha, input));
  }
  const approved = observation("production", "normal");
  approved.previewVerification.realDevice = "not-run";
  approved.previewVerification.realDeviceOmissionReason =
    "No physical device available; reported separately from desktop browser checks.";
  checkObservation("production", sha, approved);
});

test("delivery commit permits manifest adaptation but rejects uncommitted or unrelated code", () => {
  const cwd = mkdtempSync(join(tmpdir(), "starlit-release-"));
  const git = (...args) =>
    execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commit = (message) => {
    git("add", ".");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-m",
      message,
    );
  };
  try {
    git("init");
    mkdirSync(join(cwd, ".openai"));
    writeFileSync(join(cwd, ".gitignore"), "work/\n");
    writeFileSync(join(cwd, ".openai/hosting.json"), JSON.stringify(canonical));
    writeFileSync(join(cwd, "game.txt"), "original");
    commit("source");
    const source = git("rev-parse", "HEAD");
    assert.deepEqual(checkSource(source, cwd), canonical);
    mkdirSync(join(cwd, "work"));
    const observedPath = join(cwd, "work/observed.json");
    const production = observation("production", "normal");
    production.previewVerification.sourceCommit = source;
    writeFileSync(observedPath, JSON.stringify(production));
    assert.match(
      execFileSync(process.execPath, [checker, "production", source, observedPath], {
        cwd,
        encoding: "utf8",
      }),
      /^PASS: production/,
    );
    assert.throws(() =>
      execFileSync(process.execPath, [preparer], {
        cwd,
        env: { ...process.env, SITE_TARGET: "invalid", SOURCE_COMMIT: source },
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    assert.deepEqual(
      JSON.parse(readFileSync(join(cwd, ".openai/hosting.json"), "utf8")),
      canonical,
    );
    writeFileSync(join(cwd, "game.txt"), "unrelated change");
    assert.throws(() =>
      execFileSync(process.execPath, [preparer], {
        cwd,
        env: { ...process.env, SITE_TARGET: "preview", SOURCE_COMMIT: source },
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
    git("restore", "game.txt");
    execFileSync(process.execPath, [preparer], {
      cwd,
      env: { ...process.env, SITE_TARGET: "preview", SOURCE_COMMIT: source },
    });
    assert.throws(() => checkSource(source, cwd));
    commit("preview target");
    checkSource(source, cwd);
    writeFileSync(observedPath, JSON.stringify(observation()));
    assert.match(
      execFileSync(process.execPath, [checker, "preview", source, observedPath], {
        cwd,
        encoding: "utf8",
      }),
      /^PASS: preview/,
    );
    writeFileSync(join(cwd, "game.txt"), "changed");
    commit("unverified code");
    assert.throws(() => checkSource(source, cwd));
  } finally {
    assert.equal(dirname(resolve(cwd)), resolve(tmpdir()));
    rmSync(cwd, { recursive: true, force: true });
  }
});
