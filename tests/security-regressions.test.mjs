import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("all deployed edge functions require a verified JWT", async () => {
  const config = await read("supabase/config.toml");
  assert.doesNotMatch(config, /verify_jwt\s*=\s*false/);
  for (const functionName of ["chat-assistant", "launch-companion", "analyze-idea", "sync-grants"]) {
    assert.match(config, new RegExp(`\\[functions\\.${functionName}\\]\\s+verify_jwt\\s*=\\s*true`));
  }
});

test("grant sync is admin-only and writes valid program records", async () => {
  const sync = await read("supabase/functions/sync-grants/index.ts");
  assert.match(sync, /app_metadata\?\.role !== 'admin'/);
  assert.doesNotMatch(sync, /level:\s*'FEDERAL'/);
  assert.match(sync, /description: grant\.description \|\| grant\.synopsis \|\|/);
  assert.match(sync, /\.upsert\(batch, \{ onConflict: 'source_id' \}\)/);
});

test("browser deployment never receives an OpenAI secret", async () => {
  const files = await Promise.all([
    read(".env.example"),
    read(".github/workflows/deploy.yml"),
    read("README.md"),
    read("DEPLOYMENT_GUIDE.md"),
  ]);
  for (const file of files) assert.doesNotMatch(file, /VITE_OPENAI_API_KEY/);
});

test("GitHub Pages 404 carries deep links without browser storage", async () => {
  const notFound = await read("public/404.html");
  assert.match(notFound, /encodeURIComponent\(redirectPath\)/);
  assert.doesNotMatch(notFound, /sessionStorage/);
});

test("the repair migration enables assistant reset and quotas", async () => {
  const migration = await read("supabase/migrations/20260823010000_secure_ai_and_repair_data.sql");
  assert.match(migration, /CREATE POLICY "Users can delete own chats"/);
  assert.match(migration, /CREATE POLICY "Users can delete own progress"/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.consume_ai_quota/);
});

test("Launch Companion emits local events before the terminal stream marker", async () => {
  const launchCompanion = await read("supabase/functions/launch-companion/index.ts");
  const phaseEvent = launchCompanion.indexOf('type: "phase_update"');
  const terminalEvent = launchCompanion.lastIndexOf('"data: [DONE]\\n\\n"');
  assert.ok(phaseEvent >= 0);
  assert.ok(terminalEvent > phaseEvent);
});
