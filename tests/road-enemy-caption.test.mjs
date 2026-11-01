import { test } from "node:test";
import assert from "node:assert/strict";
import { roadEnemyCaption } from "../lib/road-enemy-caption.ts";

test("an ordinary enemy never gets the work instruction as its name", () => {
  const frame = {
    quest: { enemy: 8 },
    targets: [{ id: "enemy-1", name: "塔の周りの魔物を追い払う", cue: "" }],
  };
  const before = JSON.stringify(frame);
  assert.equal(roadEnemyCaption(frame, "enemy-1"), "スライム");
  assert.equal(roadEnemyCaption({ ...frame, quest: { enemy: 9 } }, "enemy-1"), "霧狼");
  assert.equal(
    roadEnemyCaption(
      { ...frame, quest: { enemy: 8, enemyName: "夜道に出てきたスライム" } },
      "enemy-1",
    ),
    "夜道に出てきたスライム",
  );
  assert.equal(JSON.stringify(frame), before);
});

test("specific opponents and their imminent action cues retain their labels", () => {
  const frame = {
    quest: { enemy: 10 },
    targets: [{ id: "enemy-1", name: "カボチャ頭の少女", cue: "" }],
  };
  assert.equal(roadEnemyCaption(frame, "enemy-1", "puppeteer"), "カボチャ頭の少女");
  assert.equal(
    roadEnemyCaption(
      { ...frame, targets: [{ id: "enemy-1", name: "メリル", cue: "歌い出しそう" }] },
      "enemy-1",
      "merrill",
    ),
    "歌い出しそう",
  );
});
