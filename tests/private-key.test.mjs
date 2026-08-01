import assert from "node:assert/strict";
import test from "node:test";

import { normalizePrivateKey } from "../src/lib/firebase/private-key.js";

test("normalizePrivateKey converts escaped newlines and quotes", () => {
  const raw = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----"';
  assert.equal(normalizePrivateKey(raw), "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----");
});

test("normalizePrivateKey preserves already multiline values", () => {
  const raw = "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----";
  assert.equal(normalizePrivateKey(raw), raw);
});
