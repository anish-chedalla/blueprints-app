import test from "node:test";
import assert from "node:assert/strict";
import { isProgramAvailable } from "../src/lib/program-availability.ts";

const now = new Date("2026-08-22T12:00:00.000Z");

test("hides closed and expired programs", () => {
  assert.equal(isProgramAvailable({ status: "CLOSED", rolling: true, deadline: null }, now), false);
  assert.equal(isProgramAvailable({ status: "OPEN", rolling: false, deadline: "2026-08-21T00:00:00.000Z" }, now), false);
});

test("keeps rolling and future programs visible", () => {
  assert.equal(isProgramAvailable({ status: "OPEN", rolling: true, deadline: null }, now), true);
  assert.equal(isProgramAvailable({ status: "OPEN", rolling: false, deadline: "2026-08-23T00:00:00.000Z" }, now), true);
});
