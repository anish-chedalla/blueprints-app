import assert from "node:assert/strict";
import test from "node:test";

import {
  isArizonaOpportunity,
  matchesCuratedApplicantFilter,
  matchesFundingCategory,
} from "../src/lib/grant-taxonomy.ts";

const opportunity = {
  key: "blueprints:contractor", source: "blueprints", externalId: "contractor", programId: "one",
  title: "Rural Contractor Pathway", sponsor: "Arizona Registrar of Contractors",
  description: "Training and licensing support for home improvement contractors.",
  officialUrl: "https://roc.az.gov/", level: "STATE", status: "open", opensAt: null,
  deadline: null, postedAt: null, minAmount: null, maxAmount: null, state: "AZ", city: null,
  county: null, industryTags: ["construction", "services"], demographics: [],
  applicantTypes: ["Sole proprietors", "LLCs", "Corporations"], eligibilityNotes: "Arizona applicants",
  eligibleStates: ["AZ"], minEmployees: null, maxEmployees: null, minRevenue: null, maxRevenue: null,
  sourceName: "Arizona Registrar of Contractors", sourceKind: "curated", lastVerifiedAt: "2026-09-13",
  verificationMethod: "Official page review",
};

test("environment category does not include unrelated construction records", () => {
  assert.equal(matchesFundingCategory(opportunity, "ENV"), false);
  assert.equal(matchesFundingCategory({ ...opportunity, description: "Green building and energy efficiency retrofits." }, "ENV"), true);
});

test("Arizona and business applicant filters use structured fields", () => {
  assert.equal(isArizonaOpportunity(opportunity), true);
  assert.equal(matchesCuratedApplicantFilter(opportunity, "22"), true);
  assert.equal(matchesCuratedApplicantFilter(opportunity, "23"), false);
  assert.equal(matchesCuratedApplicantFilter({ ...opportunity, applicantTypes: ["Individual artists"] }, "22|23|99"), false);
});

