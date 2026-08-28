import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../supabase/migrations/20260827010000_add_verified_arizona_state_grants.sql",
  import.meta.url,
);

const readMigration = () => readFile(migrationUrl, "utf8");

test("verified Arizona state opportunities use stable IDs and official sources", async () => {
  const migration = await readMigration();

  for (const sourceId of [
    "azarts:artist-opportunity-fy2027-cycle-b",
    "azarts:state-parks-artist-residency-spring-2027",
    "azroc:rural-r62-pathway",
    "azcommerce:azstep",
  ]) {
    assert.match(migration, new RegExp(`'${sourceId}'`));
  }

  for (const officialHost of ["azarts.gov", "roc.az.gov", "azcommerce.com"]) {
    assert.match(migration, new RegExp(`https://(?:www\\.)?${officialHost.replace(".", "\\.")}`));
  }

  assert.doesNotMatch(migration, /example\.com/);
  assert.match(migration, /ON CONFLICT \(source_id\) WHERE source_id IS NOT NULL DO UPDATE/);
});

test("dated Arizona grants have future deadlines and rolling programs omit them", async () => {
  const migration = await readMigration();

  assert.match(migration, /2026-09-24T23:59:00-07:00/);
  assert.match(migration, /2026-10-01T23:59:00-07:00/);
  assert.match(migration, /'azroc:rural-r62-pathway'[\s\S]*?'azcommerce:azstep'/);
  assert.match(migration, /true,\s*'ROLLING',\s*'azroc:rural-r62-pathway'/);
  assert.match(migration, /true,\s*'ROLLING',\s*'azcommerce:azstep'/);
});

test("stale Arizona seed claims are closed instead of shown as active", async () => {
  const migration = await readMigration();
  const repairStatements = migration.match(
    /UPDATE public\.programs[\s\S]*?WHERE name = '.*?';/g,
  );

  assert.ok(repairStatements);

  for (const staleName of [
    "Arizona Innovation Challenge",
    "Arizona Competes Fund",
    "Workforce Development Grant",
  ]) {
    const update = repairStatements.find((statement) =>
      statement.includes(`WHERE name = '${staleName}'`),
    );
    assert.ok(update, `missing repair for ${staleName}`);
    assert.match(update, /status = 'CLOSED'/);
    assert.match(update, /rolling = false/);
  }
});
