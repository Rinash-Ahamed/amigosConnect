import assert from "node:assert/strict";
import test from "node:test";

import { isDeviceAllowed, normalizeAllowedDeviceIds } from "../src/lib/auth/device-access.js";

test("normalizeAllowedDeviceIds parses comma and newline separated values", () => {
  assert.deepEqual(normalizeAllowedDeviceIds("alpha, beta\ncharlie"), ["alpha", "beta", "charlie"]);
});

test("isDeviceAllowed allows empty allowlist and exact matches", () => {
  assert.equal(isDeviceAllowed([], "alpha"), true);
  assert.equal(isDeviceAllowed(["alpha", "beta"], "beta"), true);
  assert.equal(isDeviceAllowed(["alpha", "beta"], "gamma"), false);
});
