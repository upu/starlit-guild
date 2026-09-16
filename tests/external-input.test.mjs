import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBackupReadResponse, parseBackupWriteResponse } from "../lib/backup-api.ts";
import { parseRecoveryKey } from "../lib/api-input.ts";
import { errorMessage } from "../lib/external-input.ts";

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

test("backup responses validate envelopes while keeping save payloads unknown", () => {
  const bundle = { format: 4 };
  assert.deepEqual(parseBackupWriteResponse({ at: 123, error: "ignored" }), {
    at: 123,
    error: "ignored",
  });
  assert.deepEqual(parseBackupReadResponse({ backups: [{ bundle, at: 123 }] }), {
    backups: [{ bundle, at: 123 }],
  });
  for (const value of [null, { backups: "bad" }, { backups: [{ bundle, at: "bad" }] }])
    assert.throws(() => parseBackupReadResponse(value));
});

test("unknown errors use a stable fallback message", () => {
  assert.equal(errorMessage(Error("detail"), "fallback"), "detail");
  assert.equal(errorMessage("detail", "fallback"), "fallback");
});
