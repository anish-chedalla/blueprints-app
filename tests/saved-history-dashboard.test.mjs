import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("saved funding uses one model for grants and loans", async () => {
  const [loans, saved, card] = await Promise.all([
    read("../src/pages/Loans.tsx"),
    read("../src/pages/Saved.tsx"),
    read("../src/components/ProgramCard.tsx"),
  ]);
  assert.match(loans, /from\("saved_opportunities"\)/);
  assert.doesNotMatch(loans, /from\("favorites"\)/);
  assert.match(card, /from\("saved_opportunities"\)/);
  assert.match(saved, /Saved grants & loans/);
  assert.match(saved, /savedLoans/);
  assert.match(saved, /savedGrants/);
});

test("dashboard and history are based on real source and view data", async () => {
  const [app, dashboard, history, migration] = await Promise.all([
    read("../src/App.tsx"),
    read("../src/pages/Dashboard.tsx"),
    read("../src/pages/History.tsx"),
    read("../supabase/migrations/20260913020000_add_view_history.sql"),
  ]);
  assert.match(app, /path="\/history"/);
  assert.match(app, /path="\/settings"/);
  assert.match(dashboard, /dateRange: "7"/);
  assert.match(dashboard, /loadViewHistory/);
  assert.match(history, /Clear history/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
});

test("settings separates account, business, alerts, and privacy controls", async () => {
  const settings = await read("../src/pages/Settings.tsx");
  for (const tab of ["account", "business", "alerts", "privacy"]) {
    assert.match(settings, new RegExp(`value="${tab}"`));
  }
  assert.match(settings, /updateUser/);
  assert.match(settings, /clearViewHistory/);
});

