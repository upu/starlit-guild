import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { allQuests, encounter, targetName } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { roadWorkLook } from "../lib/chapter-road-work-look.ts";
import { worksiteByLabel } from "../lib/road-worksite-catalog.ts";
import { questNodes } from "../lib/puppet-battles.ts";
import { movingWork } from "../lib/chapter-road.ts";

const jobs = storyStages.flatMap((stage) => {
  const q = allQuests.find((q) => q.id === stage.quest);
  return Array.from({ length: questNodes(q.id) }, (_, node) => ({
    q,
    run: { node, nodes: questNodes(q.id) },
  })).filter(({ run }) => encounter(q, run.node, run.nodes) !== "battle");
});

test("every work point in all four chapters has an explicitly reviewed, available illustration", () => {
  const labels = new Set();
  for (const { q, run } of jobs) {
    const label = targetName(q, run.node, run.nodes);
    assert.ok(worksiteByLabel[label], `Review the work icon: ${q.id} / ${label}`);
    const look = roadWorkLook(q, run);
    assert.ok(existsSync(`public${look.asset}`), `${label}: missing ${look.asset}`);
    assert.equal(look.label, label);
    labels.add(label);
  }
  assert.equal(jobs.length, 402);
  assert.equal(labels.size, 103);
  assert.deepEqual(
    new Set(Object.keys(worksiteByLabel).filter((label) => label !== "苗の籠を運び出す")),
    labels,
    "remove stale labels when copy changes",
  );
});

test("survey, treatment, tracking, earthwork and small deliveries show their actual subjects", () => {
  for (const [label, filename, task, cargo] of [
    ["水路を埋め戻す", "work-earthwork-v1.webp", "gather", false],
    ["灯籠を調べる", "work-lantern-v1.webp", "inspect", false],
    ["道の草を刈る", "work-grass-v1.webp", "gather", false],
    ["荷車の曲がり角を記録する", "work-route-v1.webp", "inspect", false],
    ["往診に使う湯と水を用意する", "work-medicine-v1.webp", "pack", false],
    ["家の人から空き瓶を受け取る", "work-empty-bottles-v1.webp", "pack", false],
    ["空き瓶を揺らさず運ぶ", "cargo-v1.webp", "carry", true],
    ["戻った道標の向きを確かめる", "signpost-v2.webp", "inspect", false],
    ["日取りを確かめる", "ledger-desk-v1.webp", "inspect", false],
    ["管理人の記録を渡す", "work-letters-v1.webp", "inspect", false],
    ["返事の手紙を渡す", "work-letters-v1.webp", "inspect", false],
    ["苗を湿ったまま運ぶ", "work-seedling-cart-v1.webp", "carry", true],
  ]) {
    const job = jobs.find(({ q, run }) => targetName(q, run.node, run.nodes) === label);
    assert.ok(job, label);
    const look = roadWorkLook(job.q, job.run);
    assert.equal(look.asset.split("/").at(-1), filename, label);
    assert.equal(look.task, task, label);
    assert.equal(look.cargo, cargo, label);
  }
});

test("moving work always pushes or pulls a cart, never a loose small object", () => {
  for (const { q, run } of jobs) {
    if (!movingWork(q, run) || q.escortAsset) continue;
    const look = roadWorkLook(q, run);
    assert.equal(look.cargo, true, `${q.id}: ${look.label}`);
    assert.equal(look.task, "carry", look.label);
  }
});

test("handing over requests and receiving replies leave the letters in place", () => {
  for (const label of ["依頼の手紙を渡す", "返事を受け取る"]) {
    const job = jobs.find(({ q, run }) => targetName(q, run.node, run.nodes) === label);
    assert.ok(job);
    const look = roadWorkLook(job.q, job.run);
    assert.equal(look.asset, "/animations/road/work-letters-v1.webp");
    assert.equal(look.task, "inspect");
    assert.equal(look.cargo, false);
  }
});
