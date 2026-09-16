import type { State as LegacyState } from "./game-v1.ts";
import type { Action, State } from "./game-v2.ts";
import { isRecord } from "./external-input.ts";

const actionTypes = new Set([
  "start",
  "stop",
  "party",
  "recruit",
  "gear",
  "camp",
  "daily",
  "repeat",
  "assist",
  "newSquad",
  "sync",
]);
const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const optional = (value: unknown, valid: (candidate: unknown) => boolean) =>
  value === undefined || valid(value);
const mode = (value: unknown) => value === "strike" || value === "heal";

function isAction(value: unknown): value is Action {
  if (!isRecord(value) || !isString(value.type) || !actionTypes.has(value.type)) return false;
  return [
    optional(value.squad, isString),
    optional(value.id, isString),
    optional(value.members, strings),
    optional(value.value, isBoolean),
    optional(value.mode, mode),
  ].every(Boolean);
}

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const numbers = (value: unknown): value is Record<string, number> =>
  isRecord(value) && Object.values(value).every(finite);
const logs = (value: unknown) =>
  Array.isArray(value) &&
  value.every((entry) => isRecord(entry) && typeof entry.text === "string" && finite(entry.at));
const events = (value: unknown) =>
  Array.isArray(value) &&
  value.every(
    (event) =>
      isRecord(event) &&
      typeof event.id === "string" &&
      finite(event.at) &&
      typeof event.kind === "string" &&
      typeof event.text === "string" &&
      (event.amount === undefined || finite(event.amount)) &&
      (event.hero === undefined || typeof event.hero === "string"),
  );
function isRun(value: unknown) {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return [
    isString(value.quest),
    finite(value.round),
    finite(value.node),
    ["move", "work", "rest"].includes(String(value.phase)),
    finite(value.phaseAt),
    finite(value.nextAt),
    finite(value.started),
    finite(value.hp),
    finite(value.maxHp),
    finite(value.target),
    finite(value.targetMax),
    finite(value.hits),
    finite(value.energy),
    finite(value.energyAt),
    events(value.events),
  ].every(Boolean);
}
function isSquads(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      (squad) =>
        isRecord(squad) &&
        [
          isString(squad.id),
          isString(squad.name),
          strings(squad.members),
          isBoolean(squad.repeat),
          isRun(squad.run),
        ].every(Boolean),
    )
  );
}
function hasStateBase(value: Record<string, unknown>) {
  return [
    [1, 2].includes(Number(value.version)),
    finite(value.gold),
    finite(value.herbs),
    finite(value.ore),
    strings(value.owned),
    numbers(value.xp),
    finite(value.gear),
    finite(value.camp),
    finite(value.clears),
    numbers(value.done),
    strings(value.claimed),
    isString(value.lastDaily),
    finite(value.updatedAt),
    logs(value.log),
  ].every(Boolean);
}
function isLegacyActive(value: unknown) {
  if (value === null) return true;
  return (
    isRecord(value) &&
    [isString(value.quest), finite(value.started), finite(value.duration)].every(Boolean)
  );
}

export function isStoredGameState(value: unknown): value is State | LegacyState {
  if (!isRecord(value) || !hasStateBase(value)) return false;
  if (value.version === 2) return isSquads(value.squads) && strings(value.receipts);
  return (
    value.version === 1 &&
    strings(value.party) &&
    isBoolean(value.repeat) &&
    isLegacyActive(value.active)
  );
}

export function parseGameRequest(value: unknown): { action: Action; operationId: string } | null {
  if (
    !isRecord(value) ||
    !isAction(value.action) ||
    typeof value.operationId !== "string" ||
    !/^[a-zA-Z0-9-]{16,64}$/.test(value.operationId)
  )
    return null;
  return { action: value.action, operationId: value.operationId };
}

export function parseRecoveryKey(value: unknown): string | null {
  if (
    !isRecord(value) ||
    value.game !== "starlit-guild" ||
    typeof value.recoveryKey !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.recoveryKey)
  )
    return null;
  return value.recoveryKey;
}
