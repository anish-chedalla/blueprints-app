import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("migration creates source-aware saves, searches, and reminders", async () => {
  const migration = await read("../supabase/migrations/20260908010000_unify_grant_discovery.sql");
  for (const table of ["grant_sources", "saved_opportunities", "saved_searches", "opportunity_reminders"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`));
  }
  assert.match(migration, /AZ FAST Grant - Fall 2026/);
  assert.match(migration, /NASE Growth Grant/);
  assert.match(migration, /Unverified legacy seed/);
  assert.match(migration, /FOREIGN KEY \(saved_opportunity_id, user_id\)/);
  assert.match(migration, /Official page review/);
});

test("grant finder is unified and labels automation boundaries", async () => {
  const grants = await read("../src/pages/Grants.tsx");
  assert.match(grants, /Unified search/);
  assert.match(grants, /Federal \+ reviewed/);
  assert.match(grants, /Current automation boundary/);
  assert.match(grants, /saved_opportunities/);
  assert.doesNotMatch(grants, /TabsTrigger value="federal"/);
});

test("homepage no longer simulates subscriptions or daily verification", async () => {
  const [capture, assurance, local] = await Promise.all([
    read("../src/components/home/EmailCapture.tsx"),
    read("../src/components/home/AssuranceRow.tsx"),
    read("../src/components/home/LocalCoverage.tsx"),
  ]);
  assert.doesNotMatch(capture, /TODO: Connect to backend/);
  assert.doesNotMatch(assurance, /verified daily/i);
  assert.doesNotMatch(local, /complete coverage/i);
});

test("scheduled alert worker requires a second secret and supports real email", async () => {
  const worker = await read("../supabase/functions/process-alerts/index.ts");
  assert.match(worker, /ALERT_CRON_SECRET/);
  assert.match(worker, /RESEND_API_KEY/);
  assert.match(worker, /saved_searches/);
  assert.match(worker, /opportunity_reminders/);
});
