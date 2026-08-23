import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRedirectPath, redirectPathFromSearch } from "../src/lib/github-pages.ts";

test("normalizes GitHub Pages deep links under the app basename", () => {
  assert.equal(normalizeRedirectPath("/grants?type=open"), "/blueprints-app/grants?type=open");
  assert.equal(normalizeRedirectPath("/blueprints-app/loans"), "/blueprints-app/loans");
});

test("rejects protocol-relative and non-path redirects", () => {
  assert.equal(normalizeRedirectPath("//malicious.example/path"), null);
  assert.equal(normalizeRedirectPath("https://malicious.example"), null);
});

test("decodes the route carried by GitHub Pages 404", () => {
  assert.equal(
    redirectPathFromSearch("?redirect=%2Fblueprints-app%2Fgrants%3Ftype%3Dopen"),
    "/blueprints-app/grants?type=open",
  );
});
