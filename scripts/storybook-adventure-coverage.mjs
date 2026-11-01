import {
  chapterFourHandoff,
  chapterThreeHandoffs,
  handoffQuest,
} from "../app/phone-restoration-mode.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

// Follow the same default handoff and rendering inputs as the phone game.
// This checks registration, not whether the resulting animation looks correct.
export function adventureCoverageInput(quest) {
  const squad = { id: "coverage", run: { quest, started: 1 } };
  const model = { squad, ending: null, quest: { id: quest } };
  const third = chapterThreeHandoffs(model, false, false, false);
  const fourth = chapterFourHandoff(model, third.berne, third.night, false, false);
  const selected = handoffQuest(
    third.night,
    fourth.lantern,
    fourth.linde,
    fourth.brekka,
    fourth.trail,
    fourth.secondDay,
    fourth.records,
    fourth.seedlings,
    fourth.founding,
  );
  const enabled = Object.values({ ...third, ...fourth }).some(Boolean);
  const state = restorationHandoffState({
    enabled,
    quest: selected,
    squad,
    ending: null,
    view: "adventure",
    sheet: null,
    ready: true,
    snapshot: null,
    finished: null,
  });
  const input = { squad, startQuest: quest };
  const visual = restorationVisualInput(input, {
    quest: selected,
    active: state.active,
    squad: state.candidate,
    skipped: false,
    dialogue: "pending",
  });
  return storybookAdventureInput(visual);
}
