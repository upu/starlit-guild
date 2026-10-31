import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

const id = "starlit-guild-founding-return";
test("specimen carriers clear the empty chair on arrival and departure", () => {
  for (const [line, who] of [
    [16, "aria"],
    [18, "lico"],
    [21, "lico"],
  ]) {
    const cue = storyStageCue(id, line);
    const seat = cue.items.find((p) => p.id === "representative-chair");
    let from = storyStageCue(id, line - 1).actors.find((a) => a.id === who);
    for (const state of [cue, ...cue.sequence]) {
      const to = state.actors.find((a) => a.id === who);
      const duration = journeyDuration(to, from);
      for (let time = 0; time <= duration + 100; time += 50) {
        const at = sampleJourney(to, from, time, false);
        const distance = Math.hypot(at.x - seat.x, (at.bottom - seat.bottom) / 1.5);
        assert.ok(distance > seat.width / 2 + 1, `${who} line ${line} at ${time}: ${distance}`);
      }
      from = to;
    }
  }
  const returned = storyStageCue(id, 22);
  const seat = returned.items.find((p) => p.id === "representative-chair");
  const finn = returned.actors.find((a) => a.id === "finn");
  assert.equal(seat.x, finn.x);
  assert.equal(finn.seated, true);
});
test("Aria carries the specimen around Mira instead of walking through her", () => {
  for (const line of [16, 21]) {
    const cue = storyStageCue(id, line);
    const aria = cue.actors.find((a) => a.id === "aria");
    const mira = cue.actors.find((a) => a.id === "mira");
    const start = storyStageCue(id, line - 1).actors.find((a) => a.id === "aria");
    const duration = journeyDuration(aria, start);
    for (let time = 0; time <= duration + 100; time += 100) {
      const at = sampleJourney(aria, start, time, false);
      assert.ok(
        Math.hypot(at.x - mira.x, ((at.bottom - (mira.bottom ?? 14)) * 2) / 3) > cue.cell / 2,
      );
    }
  }
});
const dish = (s) => s.items.find((p) => p.id === "sample-dish");
function positions(actors) {
  return new Map(
    actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, ...pose, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
}
test("the same specimen meets the table and both carriers' hands without a size jump", () => {
  const placing = storyStageCue(id, 16);
  const placed = placing.sequence.find((s) => dish(s)?.support === "table");
  const surface = dish(placed);
  assert.ok(
    placed.after >
      journeyDuration(
        placing.actors.find((a) => a.id === "aria"),
        storyStageCue(id, 15).actors.find((a) => a.id === "aria"),
      ),
  );
  const pickup = storyStageCue(id, 18);
  for (const [held, actors, cue] of [
    [dish(placing), placing.actors, placing],
    [dish(pickup.sequence[0]), pickup.sequence[0].actors, pickup],
  ]) {
    const at = stageItemTarget(held, cue, positions(actors));
    assert.ok(Math.hypot(at.x - surface.x, at.bottom - surface.bottom) < 0.01);
    assert.equal(held.width, surface.width);
  }
  const from = storyStageCue(id, 17).actors.find((a) => a.id === "lico");
  assert.ok(
    pickup.sequence[0].after >
      journeyDuration(
        pickup.actors.find((a) => a.id === "lico"),
        from,
      ),
  );
  const record = storyStageCue(id, 21);
  const stored = record.sequence.find((s) => dish(s)?.stored);
  const written = record.sequence.find(
    (s) => s.actors.find((a) => a.id === "lico").mossStudy === "write",
  );
  assert.ok(written.after < stored.after);
  assert.equal(stored.items.find((p) => p.id === dish(stored).carrier).actor, "lico");
  assert.equal(dish(stored).width, surface.width);
});
