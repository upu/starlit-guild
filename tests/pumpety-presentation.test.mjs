import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { chapterTwoBanter } from "../lib/chapter-two.ts";
import { pumpetyBattleBanter, pumpetyBattleExchanges } from "../lib/pumpety-battle-banter.ts";
import { portraitAtlases, expressionPortrait } from "../lib/portrait-expressions.ts";
import { startBanter, retainBanter, nextBanter } from "../lib/banter-exchange.ts";

test("normal blockade play projects command motions and retains masked dialogue through escape", () => {
  let s = act(
    testState(1000, 15, 19, 1000),
    { type: "start", id: "sweet-blockade", readDeparture: true, value: false },
    1000,
  );
  let chat = startBanter([]);
  const seen = new Set();
  let command = false;
  for (let i = 0; i < 20000 && s.squads[0].run; i++) {
    const run = s.squads[0].run;
    const lines = pumpetyBattleBanter(run);
    if (lines) {
      assert.deepEqual(chapterTwoBanter(run), lines);
      seen.add(Object.entries(pumpetyBattleExchanges).find(([, value]) => value === lines)[0]);
      chat = retainBanter(chat, lines);
    }
    const { battle } = chapterRoadFrame({
      squad: s.squads[0],
      now: s.updatedAt,
      ready: true,
      paused: false,
    });
    if (battle.effects.some((effect) => effect.kind === "command")) {
      command = true;
      assert.equal(battle.enemies.find((enemy) => enemy.kind === "pumpety").action, "command");
      assert.ok(battle.enemies.some((enemy) => enemy.action === "rally"));
    }
    s = settle(s, run.nextAt);
  }
  assert.ok(command);
  for (const key of ["opening", "command", "falter", "escape"]) assert.ok(seen.has(key), key);
  for (let i = 0; i < 30; i++) chat = nextBanter(chat, []);
  const masked = chat.history.filter((line) => line.speaker === "masked-pumpety");
  assert.equal(masked.length, 4);
  assert.equal(new Set(masked.map((line) => line.text)).size, 4);
  assert.ok(s.done["sweet-blockade"]);
});

test("every battle line specifies a supported portrait without exposing Pumpety's face", () => {
  for (const lines of Object.values(pumpetyBattleExchanges))
    for (const line of lines) {
      assert.notEqual(line.speaker, "pumpety");
      assert.ok(portraitAtlases[line.speaker].expressions.includes(line.expression));
      if (line.speaker === "masked-pumpety")
        assert.equal(
          expressionPortrait(line.speaker, line.expression).src,
          "/portraits/masked-pumpety-expressions.webp",
        );
    }
  assert.equal(pumpetyBattleBanter({ quest: "sweet-blockade", phase: "rest" }), null);
  assert.equal(pumpetyBattleBanter({ quest: "medicine-road-home", phase: "travel" }), null);
});
