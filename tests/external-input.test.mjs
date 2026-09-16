import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBackupReadResponse, parseBackupWriteResponse } from "../lib/backup-api.ts";
import { parseGameRequest, parseRecoveryKey, isStoredGameState } from "../lib/api-input.ts";
import { errorMessage, parseJson } from "../lib/external-input.ts";
import { initialState as initialV1 } from "../lib/game-v1.ts";
import { initialState as initialV2 } from "../lib/game-v2.ts";

test("API operation input accepts the supported shape and rejects malformed fields", () => {
  const operationId = "operation-123456";
  assert.deepEqual(
    parseGameRequest(
      parseJson(JSON.stringify({ action: { type: "assist", mode: "heal" }, operationId })),
    ),
    { action: { type: "assist", mode: "heal" }, operationId },
  );
  for (const value of [
    null,
    [],
    { action: { type: "unknown" }, operationId },
    { action: { type: "party", members: [1] }, operationId },
    { action: { type: "sync" }, operationId: "short" },
  ])
    assert.equal(parseGameRequest(value), null);
});

test("recovery input validates the game marker and secret format", () => {
  const key = "a".repeat(64);
  assert.equal(parseRecoveryKey({ game: "starlit-guild", recoveryKey: key }), key);
  for (const value of [
    null,
    { game: "other", recoveryKey: key },
    { game: "starlit-guild", recoveryKey: "not-a-key" },
  ])
    assert.equal(parseRecoveryKey(value), null);
});

test("stored legacy game states are checked before migration", () => {
  assert.equal(isStoredGameState(initialV1(1000)), true);
  assert.equal(isStoredGameState(initialV2(1000)), true);
  assert.equal(isStoredGameState({ ...initialV2(1000), squads: "bad" }), false);
  assert.equal(
    isStoredGameState({
      ...initialV1(1000),
      active: { quest: "herbs", started: "bad", duration: 60 },
    }),
    false,
  );
});

test("backup responses validate envelopes while keeping save payloads unknown", () => {
  const bundle = { format: 4 };
  assert.deepEqual(parseBackupWriteResponse({ at: 123, error: "ignored" }), {
    at: 123,
    error: "ignored",
  });
  assert.deepEqual(
    parseBackupReadResponse({ backups: [{ bundle, at: 123 }], legacy: { version: 2 } }),
    { backups: [{ bundle, at: 123 }], legacy: { version: 2 } },
  );
  for (const value of [null, { backups: "bad" }, { backups: [{ bundle, at: "bad" }] }])
    assert.throws(() => parseBackupReadResponse(value));
});

test("unknown errors use a stable fallback message", () => {
  assert.equal(errorMessage(Error("detail"), "fallback"), "detail");
  assert.equal(errorMessage("detail", "fallback"), "fallback");
});
