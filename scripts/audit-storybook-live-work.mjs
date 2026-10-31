import { writeFile } from "node:fs/promises";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { groundWorkVisible, storybookWorkAppearance } from "../lib/road-storybook-work.ts";
import { adventureCoverageInput } from "./storybook-adventure-coverage.mjs";
import { townParcelCarry, townParcelCheck, townParcelAsset } from "../lib/road-town-parcel.ts";

// Inspect the generic ground-object path after quest-specific presentation and
// motion have run. This is a source/rendering audit, not visual certification.
const rows = [];
for (const [index, stage] of storyStages.entries()) {
  let state = testState(0, index, 40, 10000);
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, 0);
  state = act(state, { type: "start", id: stage.quest, readDeparture: true, value: false }, 0);
  const motion = new RoadMotion();
  const seen = new Map();
  for (let time = 0; time < 900000 && state.squads[0].run; time += 100) {
    state = settle(state, time);
    if (!state.squads[0].run) break;
    const input = {
      ...adventureCoverageInput(stage.quest),
      squad: state.squads[0],
      startQuest: stage.quest,
      now: time,
      ready: true,
      paused: false,
    };
    const frame = chapterRoadFrame(input, false, 1400, { width: 936, height: 624 });
    const { battle, look } = motion.update(frame, stage.quest, 936, false, 624);
    if (!battle.gathering || !groundWorkVisible(battle, look)) continue;
    const appearance = storybookWorkAppearance(look);
    const asset =
      townParcelCarry(battle, look) || townParcelCheck(battle, look)
        ? townParcelAsset
        : (appearance?.asset ?? look.work?.asset);
    const key = `${look.work?.label}:${asset}`;
    seen.set(key, {
      label: look.work?.label,
      asset,
      frame: look.work?.frame,
      painted: asset?.startsWith("/storybook-study/") ?? false,
      task: battle.gathering.task,
      townHandoff: battle.townParcelHandoff,
      foundingCue: look.foundingDraft?.cue,
      props: battle.waterwayActions?.props.map((p) => p.asset),
    });
  }
  rows.push({
    quest: stage.quest,
    complete: !state.squads[0].run,
    visibleGenericWork: [...seen.values()],
  });
}
await writeFile("work/storybook-live-work-coverage.json", JSON.stringify(rows, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      stages: rows.length,
      unfinished: rows.filter((r) => !r.complete).map((r) => r.quest),
      legacy: rows.flatMap((r) =>
        r.visibleGenericWork.filter((w) => !w.painted).map((w) => ({ quest: r.quest, ...w })),
      ),
    },
    null,
    2,
  ),
);
