import assert from "node:assert/strict";
import test from "node:test";
import { evaluateEligibility } from "../src/lib/eligibility.ts";

const profile = {
  id: "profile-1", user_id: "user-1", business_name: "Desert Robotics", business_type: "LLC",
  city: "Phoenix", county: "Maricopa", employees: 12, revenue_usd: 250000,
  years_in_business: 3, email_alerts_enabled: false,
  industry_tags: ["technology"], demographics: [], created_at: "2026-01-01", updated_at: "2026-01-01",
};

const opportunity = {
  key: "blueprints:fast", source: "blueprints", externalId: "fast", programId: "program-1",
  title: "AZ FAST", sponsor: "Arizona Commerce Authority", description: "SBIR proposal support",
  officialUrl: "https://www.azcommerce.com/fast-program/", level: "STATE", status: "forecasted",
  opensAt: "2026-09-24", deadline: "2026-10-19", postedAt: null, minAmount: 0, maxAmount: 3000,
  state: "AZ", city: null, county: null, industryTags: ["technology"], demographics: [],
  applicantTypes: ["For-profit small businesses"], eligibilityNotes: "Arizona for-profit, 500 employees or fewer",
  eligibleStates: ["AZ"], minEmployees: null, maxEmployees: 500, minRevenue: null, maxRevenue: null,
  sourceName: "Arizona Commerce Authority", sourceKind: "curated", lastVerifiedAt: "2026-09-08",
  verificationMethod: "Official page review",
};

test("returns a likely match with human-readable evidence", () => {
  const result = evaluateEligibility(profile, opportunity);
  assert.equal(result.verdict, "likely");
  assert.ok(result.score >= 70);
  assert.ok(result.reasons.some((reason) => reason.includes("Arizona")));
  assert.ok(result.reasons.some((reason) => reason.includes("employee")));
});

test("hard geographic conflicts produce an unlikely result", () => {
  const result = evaluateEligibility(profile, { ...opportunity, city: "Tucson" });
  assert.equal(result.verdict, "unlikely");
  assert.ok(result.cautions.some((reason) => reason.includes("Tucson")));
});

test("missing profile never pretends to know eligibility", () => {
  const result = evaluateEligibility(null, opportunity);
  assert.equal(result.verdict, "profile-needed");
  assert.equal(result.score, 0);
});

test("membership-gated funding stays possible until membership is confirmed", () => {
  const result = evaluateEligibility(profile, {
    ...opportunity,
    level: "NATIONAL",
    eligibleStates: [],
    applicantTypes: ["Self-employed NASE members", "LLCs"],
    eligibilityNotes: "Membership is required before applying.",
  });
  assert.equal(result.verdict, "possible");
  assert.ok(result.missing.some((reason) => reason.includes("membership")));
});
