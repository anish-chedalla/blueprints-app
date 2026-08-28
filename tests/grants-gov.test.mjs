import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchFederalGrantDetail,
  grantsGovOpportunityUrl,
  htmlToPlainText,
  normalizeGrantDate,
  searchFederalGrants,
} from "../src/lib/grants-gov.ts";

test("searchFederalGrants reads the nested API response and sends a browser-simple request", async (t) => {
  const originalFetch = globalThis.fetch;
  let capturedRequest;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (url, init) => {
    capturedRequest = { url, init };
    return new Response(JSON.stringify({
      errorcode: 0,
      msg: "Webservice Succeeds",
      data: {
        hitCount: 415,
        startRecord: 20,
        suggestion: "",
        oppHits: [{
          id: "357305",
          number: "PAR-25-274",
          title: "Research &amp; development &ndash; pilot",
          agencyCode: "HHS-NIH11",
          agency: "National Institutes of Health",
          openDate: "11/21/2024",
          closeDate: "11/17/2026",
          oppStatus: "posted",
          docType: "synopsis",
          cfdaList: ["93.213"],
        }],
      },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const result = await searchFederalGrants({
    keyword: "research",
    status: "posted",
    eligibility: "23|99",
    instrument: "G",
    page: 1,
    rows: 20,
  });

  assert.equal(capturedRequest.url, "https://api.grants.gov/v1/api/search2");
  assert.equal(capturedRequest.init.headers["Content-Type"], "text/plain;charset=UTF-8");
  assert.deepEqual(JSON.parse(capturedRequest.init.body), {
    rows: 20,
    startRecordNum: 20,
    keyword: "research",
    oppStatuses: "posted",
    eligibilities: "23|99",
    fundingCategories: "",
    agencies: "",
    fundingInstruments: "G",
  });
  assert.equal(result.hitCount, 415);
  assert.equal(result.opportunities[0].title, "Research & development – pilot");
  assert.equal(result.opportunities[0].closeDate, "2026-11-17");
  assert.deepEqual(result.opportunities[0].alnNumbers, ["93.213"]);
});

test("fetchFederalGrantDetail normalizes important opportunity fields", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async () => new Response(JSON.stringify({
    errorcode: 0,
    data: {
      id: 357305,
      opportunityNumber: "PAR-25-274",
      opportunityTitle: "Feasibility Trial",
      owningAgencyCode: "HHS-NIH11",
      ost: "POSTED",
      docType: "synopsis",
      opportunityCategory: { description: "Discretionary" },
      agencyDetails: { agencyName: "National Institutes of Health" },
      synopsis: {
        agencyName: "National Institutes of Health",
        synopsisDesc: "<p>Detailed <strong>funding</strong> overview.</p>",
        postingDateStr: "2024-11-21-00-00-00",
        responseDateStr: "2026-11-17-00-00-00",
        archiveDateStr: "2026-12-23-00-00-00",
        awardFloor: "25,000",
        awardCeiling: "100000",
        estimatedFunding: "500000",
        expectedNumberOfAwards: 5,
        costSharing: false,
        applicantEligibilityDesc: "Small businesses may apply.",
        applicantTypes: [{ description: "Small businesses" }],
        fundingInstruments: [{ description: "Grant" }],
        fundingActivityCategories: [{ description: "Health" }],
        agencyContactName: "Grant Office",
        agencyContactEmail: "grants@example.gov",
        agencyContactPhone: "555-0100",
        fundingDescLinkUrl: "https://example.gov/announcement",
      },
      cfdas: [{ cfdaNumber: "93.213", programTitle: "Research program" }],
    },
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  const detail = await fetchFederalGrantDetail("357305");

  assert.equal(detail.description, "Detailed funding overview.");
  assert.equal(detail.deadline, "2026-11-17");
  assert.equal(detail.awardFloor, 25_000);
  assert.equal(detail.awardCeiling, 100_000);
  assert.equal(detail.expectedAwards, 5);
  assert.deepEqual(detail.applicantTypes, ["Small businesses"]);
  assert.deepEqual(detail.alnNumbers, [{ number: "93.213", title: "Research program" }]);
  assert.equal(detail.officialUrl, "https://www.grants.gov/search-results-detail/357305");
});

test("grant text, date, and URL helpers handle public API formats", () => {
  assert.equal(htmlToPlainText("<p>A &amp; B &#8212; test</p>"), "A & B — test");
  assert.equal(normalizeGrantDate("7/4/2027"), "2027-07-04");
  assert.equal(normalizeGrantDate("2028-01-09-00-00-00"), "2028-01-09");
  assert.equal(grantsGovOpportunityUrl(123), "https://www.grants.gov/search-results-detail/123");
});

test("fetchFederalGrantDetail rejects invalid opportunity IDs before making a request", async () => {
  await assert.rejects(() => fetchFederalGrantDetail("not-a-number"), /Invalid Grants.gov opportunity ID/);
});
