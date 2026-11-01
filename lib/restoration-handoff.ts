import type { Squad } from "./game.ts";
import type { Story } from "./stories.ts";

type Input = {
  enabled: boolean;
  quest?:
    | "berne-restoration"
    | "keystone-night-road"
    | "linde-requests"
    | "lantern-detour"
    | "brekka-arrival"
    | "glowing-moss-trail"
    | "glowing-moss-trail-next-day"
    | "lico-records"
    | "merrill-seedlings"
    | "town-deliveries"
    | "tower-moss-removal"
    | "missing-keystone"
    | "forest-wetland"
    | "old-waterway"
    | "starlit-guild-founding";
  squad: Squad;
  ending: Story | null;
  view: string;
  sheet: unknown;
  ready: boolean;
  snapshot: Squad | null;
  finished: string | null;
  skipped?: string | null;
};
function handoffWaiting(input: Input, previous: boolean, key: string) {
  return (
    previous && input.finished !== key && input.view === "adventure" && !input.sheet && input.ready
  );
}
function keepFinishedScene(input: Input, previous: boolean, key: string) {
  return (
    previous && input.finished === key && input.view === "adventure" && !input.sheet && input.ready
  );
}
function hasPreviousRun(input: Input, quest: string) {
  return (
    input.enabled &&
    !input.squad.run &&
    input.ending?.quest === quest &&
    input.snapshot?.run?.quest === quest
  );
}
export function restorationHandoffState(input: Input) {
  const quest = input.quest ?? "berne-restoration";
  const run = input.squad.run;
  const running = input.enabled && run?.quest === quest;
  const previous = hasPreviousRun(input, quest);
  const candidate = running ? input.squad : previous ? input.snapshot : null;
  const holdRecords = running && keepRecordsEncounter(input, quest);
  const key = candidate?.run ? `${candidate.id}:${String(candidate.run.started)}` : "";
  const waiting = handoffWaiting(input, previous, key);
  return {
    capture: running && input.snapshot?.run !== run && !holdRecords,
    key,
    waiting,
    completed: watchedWork(input, previous, key),
    active: running || waiting || keepFinishedScene(input, previous, key),
    candidate,
    recordsSquad: holdRecords ? input.snapshot : null,
  };
}

function watchedWork(input: Input, previous: boolean, key: string) {
  return previous && !!key && input.finished === key && input.skipped !== key;
}

// Keep the last actually observed active apparatus while its retained dialogue plays.
// A new run must always replace the previous snapshot.
function keepRecordsEncounter(input: Input, quest: string) {
  const current = input.squad.run;
  const previous = input.snapshot?.run;
  const active = (run: Squad["run"]) =>
    !!run?.enemies?.some((enemy) => enemy.trick === "lico" && enemy.hp > 0);
  return (
    quest === "lico-records" &&
    !!current &&
    !!previous &&
    input.snapshot?.id === input.squad.id &&
    previous.started === current.started &&
    previous.node <= current.node &&
    active(previous) &&
    !active(current)
  );
}
