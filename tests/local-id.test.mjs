import { test } from "node:test";
import assert from "node:assert/strict";
import { localId } from "../lib/local-id.ts";
import { z } from "zod";

test("local identifiers remain UUIDs on secure origins", () => {
  assert.equal(z.string().uuid().safeParse(localId()).success, true);
});

test("LAN HTTP without randomUUID creates distinct save-compatible v4 UUIDs", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  try {
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { getRandomValues } });
    const ids = Array.from({ length: 100 }, () => localId());
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.equal(z.string().uuid().safeParse(id).success, true);
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
  } finally {
    Object.defineProperty(globalThis, "crypto", original);
  }
});
