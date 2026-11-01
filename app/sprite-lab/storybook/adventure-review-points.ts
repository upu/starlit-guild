import type { State } from "@/lib/game";

export type ReviewMode =
  | "opening"
  | "puppet-escape"
  | "battle"
  | "battle-ending"
  | "brekka-ledger"
  | "trail-approach"
  | "earthwork"
  | "forage"
  | "forest-final"
  | "arrival"
  | "waterway"
  | "waterway-cart"
  | "waterway-basket"
  | "moss-scrape"
  | "moss-handoff"
  | "moss-final"
  | "night-push"
  | "waterway-stone"
  | "waterway-saw"
  | "founding-letter"
  | "founding-loan"
  | "founding-third-basket"
  | "founding-warehouse"
  | "founding-arrival"
  | "founding-travel"
  | "town-delivery"
  | "town-final";

export function arrivalReady(state: State) {
  const run = state.squads[0].run;
  if (run?.quest === "sweet-blockade") return run.node === run.nodes - 1;
  return !!run && run.node >= run.nodes - 2;
}

export function puppetEscapeReady(state: State) {
  return state.squads[0].run?.road?.scene?.kind === "escape";
}

export function nightPushReady(state: State) {
  const run = state.squads[0].run;
  return run?.quest === "keystone-night-road" && run.node === 1 && run.phase === "move";
}

export function brekkaLedgerReady(state: State) {
  const run = state.squads[0].run;
  return run?.quest === "brekka-arrival" && run.node === 2 && run.phase === "work";
}

function foundingReviewReady(state: State, mode: ReviewMode) {
  const run = state.squads[0].run;
  if (run?.quest !== "starlit-guild-founding" || run.enemies?.some((enemy) => enemy.hp > 0))
    return false;
  if (mode === "founding-arrival") return run.node === run.nodes - 1 && run.phase === "work";
  if (mode === "founding-travel") return run.node > 0 && run.phase === "move";
  const target = {
    "founding-letter": 0,
    "founding-loan": 1,
    "founding-warehouse": 2,
    "founding-third-basket": 7,
  };
  return run.node === target[mode as keyof typeof target] && run.phase === "work";
}

export function reviewPointReady(
  state: State,
  mode: ReviewMode,
  fallback: (state: State, mode: ReviewMode) => boolean | undefined,
) {
  if (mode === "forest-final") {
    const run = state.squads[0].run;
    return run?.quest === "forest-wetland" && run.node === run.nodes - 1 && run.phase === "work";
  }
  if (mode === "town-delivery" || mode === "town-final") return townReviewReady(state, mode);
  if (mode.startsWith("founding-")) return foundingReviewReady(state, mode);
  if (mode === "night-push") return nightPushReady(state);
  if (mode === "brekka-ledger") return brekkaLedgerReady(state);
  if (mode === "trail-approach")
    return (
      ["glowing-moss-trail", "glowing-moss-trail-next-day"].includes(
        state.squads[0].run?.quest ?? "",
      ) && state.squads[0].run?.node === 4
    );
  return fallback(state, mode);
}

function townReviewReady(state: State, mode: "town-delivery" | "town-final") {
  const run = state.squads[0].run;
  return (
    run?.quest === "town-deliveries" &&
    run.node === (mode === "town-final" ? run.nodes - 2 : 1) &&
    run.phase === "work" &&
    run.target / run.targetMax < 0.6
  );
}
