import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";

test("storybook parcel workers retain both work poses across successive frames", () => {
  for (const width of [374, 936]) {
    const height = (width * 2) / 3;
    let state = testState(100000, 2, 40, 10000);
    state = act(
      state,
      { type: "start", id: storyStages[2].quest, readDeparture: true, value: false },
      state.updatedAt,
    );
    const input = () => ({
      squad: state.squads[0],
      startQuest: storyStages[2].quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
    });
    let found = false;
    const motion = new RoadMotion();
    for (let step = 0; step < 3000; step++) {
      const frame = chapterRoadFrame(input(), false, 1400, { width, height });
      if (
        frame.battle.gathering?.task === "pack" &&
        ["aria", "leon"].every((id) => frame.look.workers.includes(id))
      ) {
        const drawn = motion.update(frame, "study", width, false, height);
        assert.deepEqual(
          drawn.look.workers.toSorted(),
          ["aria", "leon"],
          JSON.stringify({ width, heroes: drawn.battle.heroes, original: frame.battle.heroes }),
        );
        found = true;
      }
      if (found && frame.battle.gathering?.task !== "pack") break;
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(found);
  }
});
