import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const CLASSIFICATION_PATTERN = /^\s*-\s*\[[xX]\]\s*`(game-change|no-game-change)`(?:\s|$)/;
const MINOR_RELEASE_PATTERN = /^\s*-\s*\[[xX]\]\s*`minor-release`(?:\s|$)/;
export const CHANGELOG_PATH = "CHANGELOG.md";

export function classifyVersionChange(body) {
  const choices = new Set(
    String(body ?? "")
      .split(/\r?\n/)
      .map((line) => line.match(CLASSIFICATION_PATTERN)?.[1])
      .filter(Boolean),
  );
  if (choices.size !== 1)
    throw Error(
      "PR本文のバージョン判定で `game-change` または `no-game-change` のどちらか一方だけを選択してください。",
    );
  return [...choices][0];
}

const DEPENDABOT_UPDATE_PATHS = new Set(["package.json", "package-lock.json"]);

export function resolveVersionClassification(body, author, changedPaths) {
  const hasSelection = String(body ?? "")
    .split(/\r?\n/)
    .some((line) => CLASSIFICATION_PATTERN.test(line));
  if (hasSelection || author !== "dependabot[bot]") return classifyVersionChange(body);
  if (
    changedPaths.length > 0 &&
    changedPaths.every(
      (path) =>
        DEPENDABOT_UPDATE_PATHS.has(path) || /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path),
    )
  )
    return "no-game-change";
  return classifyVersionChange(body);
}

// Chapter boundaries raise the minor version, and the PR body has to ask for it explicitly.
export function wantsMinorRelease(body) {
  return String(body ?? "")
    .split(/\r?\n/)
    .some((line) => MINOR_RELEASE_PATTERN.test(line));
}

export function parseVersion(version, label = "version") {
  const match = String(version ?? "").match(VERSION_PATTERN);
  if (!match) throw Error(`${label} は x.y.z 形式で指定してください: ${version}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function validateVersionChange(baseVersion, headVersion, classification, minorRelease) {
  const base = parseVersion(baseVersion, "main の version");
  parseVersion(headVersion, "PR の version");
  if (minorRelease) {
    const expected = `${base.major}.${base.minor + 1}.0`;
    if (headVersion !== expected)
      throw Error(
        `章の区切りではマイナー版を1つ上げ、パッチ版を0へ戻します。期待値: ${expected}、現在値: ${headVersion}`,
      );
    return expected;
  }
  const expected =
    classification === "game-change"
      ? `${base.major}.${base.minor}.${base.patch + 1}`
      : `${base.major}.${base.minor}.${base.patch}`;
  if (headVersion !== expected) {
    const action =
      classification === "game-change"
        ? "ゲーム本体の変更ではパッチ版を1つ上げます"
        : "ゲーム本体に関係しない変更ではバージョンを据え置きます";
    throw Error(`${action}。期待値: ${expected}、現在値: ${headVersion}`);
  }
  return expected;
}

// A version bump is what the changelog records, so the new number has to appear there,
// not merely somewhere in the file's diff.
export function validateChangelogUpdate(baseVersion, headVersion, changelog) {
  if (baseVersion === headVersion) return false;
  const escaped = headVersion.replace(/\./g, "\\.");
  if (!new RegExp(`(^|[^\\d.])${escaped}([^\\d.]|$)`).test(String(changelog ?? "")))
    throw Error(
      `バージョンを上げるPRでは ${CHANGELOG_PATH} へ ${headVersion} の行を追加してください。`,
    );
  return true;
}

export function validatePackageLock(packageVersion, lock) {
  const versions = [lock.version, lock.packages?.[""]?.version];
  if (versions.some((version) => version !== packageVersion))
    throw Error(
      `package.json と package-lock.json のバージョンが一致していません: ${packageVersion} / ${versions.join(" / ")}`,
    );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function readBasePackage(baseRef) {
  return JSON.parse(execFileSync("git", ["show", `${baseRef}:package.json`], { encoding: "utf8" }));
}
function readChangedPaths(baseRef) {
  return execFileSync("git", ["diff", "--name-only", baseRef, "HEAD", "--"], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean);
}
function readChangelog() {
  return readFileSync(new URL(`../${CHANGELOG_PATH}`, import.meta.url), "utf8");
}

function main() {
  const baseIndex = process.argv.indexOf("--base-ref");
  const baseRef = baseIndex >= 0 ? process.argv[baseIndex + 1] : "";
  if (!baseRef) throw Error("比較元を --base-ref <commit> で指定してください。");
  const author = process.env.PR_AUTHOR;
  const classification = resolveVersionClassification(
    process.env.PR_BODY,
    author,
    author === "dependabot[bot]" ? readChangedPaths(baseRef) : [],
  );
  const minorRelease = wantsMinorRelease(process.env.PR_BODY);
  const packageInfo = readJson(new URL("../package.json", import.meta.url));
  const lock = readJson(new URL("../package-lock.json", import.meta.url));
  const basePackage = readBasePackage(baseRef);
  validatePackageLock(packageInfo.version, lock);
  validateVersionChange(basePackage.version, packageInfo.version, classification, minorRelease);
  validateChangelogUpdate(basePackage.version, packageInfo.version, readChangelog());
  const kind = minorRelease ? `${classification} + minor-release` : classification;
  console.log(
    `PR version check passed: ${kind} (${basePackage.version} -> ${packageInfo.version})`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
