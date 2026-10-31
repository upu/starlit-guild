import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { Squad } from "./game-types.ts";

export type TownActivity = { started: number; label: string | null };

export function currentTownActivity(run: Squad["run"], activity?: TownActivity | null) {
  return run?.quest === "town-deliveries" &&
    run.phase !== "rest" &&
    activity?.started === run.started
    ? activity.label
    : null;
}

/** Select dialogue for what is being drawn, without changing the saved run. */
export function townActivitySquad(squad: Squad, activity?: TownActivity | null): Squad | undefined {
  const run = squad.run;
  const label = currentTownActivity(run, activity);
  if (!run || !label) return undefined;
  const node = label === "商店へ荷物を運ぶ" ? 1 : label === "品を渡して控えを受け取る" ? 2 : null;
  return node === null ? undefined : { ...squad, run: { ...run, node, phase: "work" } };
}

/** The label follows the retained drawing only while the handoff is visible. */
export function townVisualActivity(look: RoadLook, battle: RoadBattle) {
  if (look.quest !== "town-deliveries" || !look.storybookHeroes || battle.phase === "rest")
    return null;
  return battle.townParcelHandoff ? (look.work?.label ?? null) : null;
}
