import { isRecord } from "./external-input.ts";

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
