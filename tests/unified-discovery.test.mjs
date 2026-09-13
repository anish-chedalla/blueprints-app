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
  assert.match(grants, /Federal · live Grants\.gov/);
  assert.match(grants, /Arizona · official programs/);
  assert.match(grants, /How coverage works/);
  assert.match(grants, /fetchFederalGrantDetails/);
  assert.match(grants, /matchesFundingCategory/);
  assert.match(grants, /saved_opportunities/);
  assert.doesNotMatch(grants, /TabsTrigger value="federal"/);
});

test("loan catalog hides legacy claims and uses verified official URLs", async () => {
  const [migration, loans, fallback] = await Promise.all([
    read("../supabase/migrations/20260913010000_repair_search_and_loan_catalog.sql"),
    read("../src/pages/Loans.tsx"),
    read("../src/data/verified-loans.ts"),
  ]);
  assert.match(migration, /WHERE type = 'LOAN'/);
  assert.match(migration, /Unverified legacy loan seed/);
  assert.match(migration, /https:\/\/www\.sba\.gov\/loans\/7a-loans\//);
  assert.match(migration, /https:\/\/oeo\.az\.gov\/microbiz/);
  assert.match(migration, /womensnet:amber-grants-2026/);
  assert.doesNotMatch(migration, /example\.com/);
  assert.match(loans, /VERIFIED_LOAN_FALLBACK/);
  assert.match(loans, /program\.max_amount >= desiredMinimum/);
  assert.match(fallback, /catalog:sba-7a/);
  assert.match(fallback, /https:\/\/www\.sba\.gov\/loans\/microloans\//);
  assert.doesNotMatch(fallback, /example\.com/);
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
  const [worker, auditMigration, schedule] = await Promise.all([
    read("../supabase/functions/process-alerts/index.ts"),
    read("../supabase/migrations/20260912010000_alert_delivery_observability.sql"),
    read("../.github/workflows/process-alerts.yml"),
  ]);
  assert.match(worker, /ALERT_CRON_SECRET/);
  assert.match(worker, /RESEND_API_KEY/);
  assert.match(worker, /saved_searches/);
  assert.match(worker, /opportunity_reminders/);
  assert.match(worker, /Idempotency-Key/);
  assert.match(worker, /last_event/);
  assert.match(worker, /rows: 20/);
  assert.match(worker, /observedIds/);
  assert.match(auditMigration, /CREATE TABLE IF NOT EXISTS public\.alert_deliveries/);
  assert.match(auditMigration, /Users can view own alert deliveries/);
  assert.match(schedule, /cron: "17 \* \* \* \*"/);
  assert.match(schedule, /SUPABASE_SERVICE_ROLE_KEY/);
});
