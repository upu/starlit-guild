import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storyArt } from "../lib/story-art.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { stories } from "../lib/stories.ts";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { sampleStageActor } from "../lib/story-stage.ts";

test("the tower specimen moves from its open jar to the bowl before the next line", async () => {
  const cue = studyCue("forest-wetland-return", 0, true);
  const moments = [{ after: 0, actors: cue.actors, items: cue.items }, ...cue.sequence];
  assert.equal(cue.finishBeforeAdvance, true);
  assert.deepEqual(
    moments.map((m) => m.actors.find((a) => a.id === "aria").mossStudy),
    ["reach", "show", "spread", "spread", undefined],
  );
  assert.deepEqual(
    moments.map((m) => m.items.find((i) => i.id === "sample").art),
    ["dish", "dish", "dish", "moss", "moss"],
  );
  assert.ok(moments[3].after > moments[2].after);
  for (let line = 0; line < storyArt["forest-wetland-return"].revealAtLine; line++) {
    const jar = studyCue("forest-wetland-return", line, true).items.find(
      (i) => i.id === "tower-jar",
    );
    assert.deepEqual([jar.x, jar.bottom, jar.width], [24.8, 47, 3.5]);
  }
  const aria = cue.actors.find((a) => a.id === "aria"),
    jar = cue.items.find((i) => i.id === "tower-jar"),
    bowl = cue.items.find((i) => i.id === "sample");
  const metrics = JSON.parse(
    await readFile("public/storybook-study/aria-forest-sample-v1-metrics.json"),
  );
  const cell = cue.cell ?? 24;
  const toolTip = (frame) =>
    aria.x + ((metrics[frame].left + metrics[frame].width - 96) * cell) / 192;
  assert.ok(Math.abs(toolTip(1) - jar.x) < jar.width / 2);
  assert.ok(Math.abs(toolTip(3) - (bowl.x - bowl.width / 2)) < 0.7);
  assert.ok(
    metrics.slice(1).every((m) => m.height < metrics[0].height * 0.8 && m.top + m.height === 176),
  );
  const image = await sharp("public/storybook-study/aria-forest-sample-v1.webp").metadata();
  assert.deepEqual([image.width, image.height, image.hasAlpha], [768, 192, true]);
  const prepared = storyCastImages(stories.find((story) => story.id === "forest-wetland-return"));
  assert.ok(prepared.includes("/storybook-study/aria-forest-sample-v1.webp"));
  assert.ok(prepared.includes("/storybook-study/moss-jar-open-v1.webp"));
});

test("forest comparison preserves the authored illustration reveal", () => {
  const id = "forest-wetland-return",
    reveal = storyArt[id].revealAtLine;
  const cue = studyCue(id, reveal - 1, true);
  assert.ok(cue);
  assert.ok(cue.items.every((item) => item.width <= 5.5));
  assert.equal(studyCue(id, reveal, true), null);
});

test("the forest sample travels from the colony to Leon's bowl without crossing the vessels", async () => {
  const cue = studyCue("forest-wetland-return", 4, true);
  const moments = [{ after: 0, actors: cue.actors, items: cue.items }, ...cue.sequence];
  const aria = (m) => m.actors.find((actor) => actor.id === "aria");
  const forest = (m) => m.items.find((item) => item.id === "forest");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.deepEqual(
    moments.map((m) => forest(m).art),
    ["dish", "dish", "dish", "dish", "dish", "moss", "moss"],
  );
  assert.deepEqual(
    moments.map((m) => aria(m).mossStudy),
    ["reach", "show", "brace", "brace", "spread", "spread", undefined],
  );
  const start = aria(moments[2]),
    moving = aria(moments[3]),
    arrival = aria(moments[4]);
  assert.ok(journeyDuration(moving, start) < moments[4].after - moments[3].after);
  for (let time = 0; time <= journeyDuration(moving, start); time += 25) {
    const pos = sampleJourney(moving, start, time, false);
    for (const item of cue.items.filter((i) => ["sample", "forest", "tower-jar"].includes(i.id)))
      assert.ok(
        Math.abs(pos.x - item.x) > item.width / 2 + 2 || pos.bottom >= item.bottom + 6,
        `foot overlaps ${item.id} at ${time}ms`,
      );
  }
  assert.equal(arrival.left, true);
  assert.ok(arrival.x > forest(moments[4]).x + forest(moments[4]).width / 2);
  const metrics = JSON.parse(
    await readFile("public/storybook-study/aria-forest-carry-walk-v1-metrics.json"),
  );
  assert.ok(metrics.every((m) => Math.abs(m.height - 134) <= 3 && m.top + m.height === 176));
  assert.ok(
    storyCastImages(stories.find((story) => story.id === "forest-wetland-return")).includes(
      "/storybook-study/aria-forest-carry-walk-v1.webp",
    ),
  );
});

test("folded cloth and jar keep supported palms through ownership changes and departure", () => {
  for (const cue of [
    studyCue("forest-wetland-departure", 0, true),
    studyCue("forest-wetland-departure", 4, true),
    storybookExitCue("forest-wetland-departure"),
  ]) {
    for (const item of cue.items.filter((prop) => prop.actor && prop.id !== "forest-day-bag")) {
      assert.equal(item.wrist, true);
      assert.equal(item.wristAnchor, "bottom");
      assert.equal(cue.actors.find((actor) => actor.id === item.actor).carry, true);
    }
  }
  const handoff = studyCue("forest-wetland-departure", 4, true);
  assert.equal(handoff.finishBeforeAdvance, true);
  assert.equal(handoff.items.find((item) => item.art === "cloth").actor, "aria");
  assert.equal(handoff.sequence[0].items.find((item) => item.art === "cloth").actor, "leon");
  assert.ok(handoff.sequence[1].after - handoff.sequence[0].after >= 650);
  assert.equal(handoff.sequence[0].actors.find((actor) => actor.id === "leon").x, 49.5);
});

test("forest preparation shows only rope at the small carried bag and retains it on exit", () => {
  for (let line = 0; line < 17; line++) {
    const cue = studyCue("forest-wetland-departure", line, true);
    const bag = cue.items.find((item) => item.id === "forest-day-bag");
    assert.equal(bag.actor, "leon");
    assert.ok(bag.width < 5);
    assert.ok(!cue.items.some((item) => item.art === "tools"));
    const rope = cue.items.find((item) => item.id === "supplies");
    assert.equal(!!rope, line >= 7 && line <= 12);
    if (rope) {
      assert.equal(rope.art, "twine");
      assert.equal(rope.carrier, bag.id);
      const target = (x, bottom, left) => {
        const positions = new Map([["leon", { x, bottom, left }]]);
        const b = stageItemTarget(bag, cue, positions);
        positions.set(`item:${bag.id}`, { ...b, mirrored: left });
        return { bag: b, rope: stageItemTarget(rope, cue, positions) };
      };
      for (const left of [false, true]) {
        const a = target(50, 14, left),
          b = target(62, 19, left);
        assert.equal(b.rope.x - a.rope.x, 12);
        assert.ok(Math.abs(b.rope.bottom - a.rope.bottom - 5) < 1e-9);
        assert.equal(a.rope.x, a.bag.x);
        assert.ok(a.rope.bottom > a.bag.bottom && a.rope.bottom < a.bag.bottom + 6);
      }
    }
  }
  const exit = storybookExitCue("forest-wetland-departure");
  assert.ok(exit.items.some((item) => item.id === "forest-day-bag" && item.actor === "leon"));
  assert.equal(exit.actors.find((actor) => actor.id === "leon").carry, false);
  assert.ok(
    storyCastImages(stories.find((story) => story.id === "forest-wetland-departure")).includes(
      "/storybook-study/common-delivery-bag-v1.webp",
    ),
  );
});

test("the last cloth handoff meets palms before Aria receives it and Leon steps away", () => {
  const cue = studyCue("forest-wetland-departure", 16, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(cue.items.find((item) => item.art === "cloth").actor, "leon");
  const received = { ...cue, ...cue.sequence[0] };
  assert.equal(received.items.find((item) => item.art === "cloth").actor, "aria");
  const position = (state) =>
    stageItemTarget(
      state.items.find((item) => item.art === "cloth"),
      state,
      new Map(state.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 3000, true)])),
    );
  const before = position(cue),
    after = position(received);
  assert.ok(Math.abs(before.x - after.x) < 0.1);
  assert.ok(Math.abs(before.bottom - after.bottom) < 0.1);
  const final = cue.sequence.at(-1);
  assert.ok(final.after > cue.sequence[0].after + 600);
  assert.ok(
    final.actors.find((actor) => actor.id === "leon").x >
      received.actors.find((actor) => actor.id === "leon").x + 10,
  );
});
