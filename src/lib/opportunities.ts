import type { Tables } from "@/integrations/supabase/types";
import type { FederalGrantDetail, FederalGrantSearchHit } from "@/lib/grants-gov";

export type OpportunitySource = "grants.gov" | "blueprints";
export type OpportunityStatus = "open" | "forecasted" | "rolling" | "closed";

export interface Opportunity {
  key: string;
  source: OpportunitySource;
  externalId: string;
  programId: string | null;
  title: string;
  sponsor: string;
  description: string;
  officialUrl: string;
  level: "LOCAL" | "STATE" | "NATIONAL";
  status: OpportunityStatus;
  opensAt: string | null;
  deadline: string | null;
  postedAt: string | null;
  minAmount: number | null;
  maxAmount: number | null;
  state: string | null;
  city: string | null;
  county: string | null;
  industryTags: string[];
  demographics: string[];
  applicantTypes: string[];
  eligibilityNotes: string;
  eligibleStates: string[];
  minEmployees: number | null;
  maxEmployees: number | null;
  minRevenue: number | null;
  maxRevenue: number | null;
  sourceName: string;
  sourceKind: string;
  lastVerifiedAt: string | null;
  verificationMethod: string;
}

type Program = Tables<"programs">;

function normalizedProgramStatus(program: Program): OpportunityStatus {
  if (program.status === "CLOSED") return "closed";
  if (program.rolling || program.status === "ROLLING") return "rolling";
  if (program.opens_at && new Date(program.opens_at).getTime() > Date.now()) return "forecasted";
  return "open";
}

export function curatedProgramToOpportunity(program: Program): Opportunity {
  const externalId = program.source_id || program.id;
  return {
    key: opportunityKey("blueprints", externalId),
    source: "blueprints",
    externalId,
    programId: program.id,
    title: program.name,
    sponsor: program.sponsor,
    description: program.description,
    officialUrl: program.source_url || program.url,
    level: program.level,
    status: normalizedProgramStatus(program),
    opensAt: program.opens_at,
    deadline: program.deadline,
    postedAt: null,
    minAmount: program.min_amount,
    maxAmount: program.max_amount,
    state: program.state,
    city: program.city,
    county: program.county,
    industryTags: program.industry_tags || [],
    demographics: program.demographics || [],
    applicantTypes: program.applicant_types || [],
    eligibilityNotes: program.eligibility_notes || "Review the official source for complete eligibility requirements.",
    eligibleStates: program.eligible_states || [],
    minEmployees: program.min_employees,
    maxEmployees: program.max_employees,
    minRevenue: program.min_revenue,
    maxRevenue: program.max_revenue,
    sourceName: program.source_name || program.sponsor,
    sourceKind: program.source_kind || "curated",
    lastVerifiedAt: program.last_verified_at,
    verificationMethod: program.verification_method || "Official page review",
  };
}

export function federalHitToOpportunity(hit: FederalGrantSearchHit): Opportunity {
  return {
    key: opportunityKey("grants.gov", hit.id),
    source: "grants.gov",
    externalId: hit.id,
    programId: null,
    title: hit.title,
    sponsor: hit.agency,
    description: "Open the official record for the full description and eligibility requirements.",
    officialUrl: `https://www.grants.gov/search-results-detail/${encodeURIComponent(hit.id)}`,
    level: "NATIONAL",
    status: hit.status === "forecasted" ? "forecasted" : "open",
    opensAt: hit.openDate,
    deadline: hit.closeDate,
    postedAt: hit.openDate,
    minAmount: null,
    maxAmount: null,
    state: null,
    city: null,
    county: null,
    industryTags: [],
    demographics: [],
    applicantTypes: [],
    eligibilityNotes: "Eligibility details are available in the official Grants.gov record.",
    eligibleStates: [],
    minEmployees: null,
    maxEmployees: null,
    minRevenue: null,
    maxRevenue: null,
    sourceName: "Grants.gov",
    sourceKind: "api",
    lastVerifiedAt: new Date().toISOString(),
    verificationMethod: "Live official API",
  };
}

export function federalDetailToOpportunity(detail: FederalGrantDetail): Opportunity {
  const base = federalHitToOpportunity({
    id: String(detail.id),
    number: detail.number,
    title: detail.title,
    agencyCode: detail.agencyCode,
    agency: detail.agency,
    openDate: detail.postedDate,
    closeDate: detail.deadline,
    status: detail.status,
    documentType: detail.documentType,
    alnNumbers: detail.alnNumbers.map((item) => item.number),
  });
  return {
    ...base,
    description: detail.description,
    minAmount: detail.awardFloor,
    maxAmount: detail.awardCeiling,
    applicantTypes: detail.applicantTypes,
    eligibilityNotes: detail.eligibilityDescription || base.eligibilityNotes,
    industryTags: detail.categories.map((category) => category.toLowerCase()),
  };
}

export function opportunityKey(source: OpportunitySource | string, externalId: string): string {
  return `${source}:${externalId}`;
}

export function serializeOpportunity(opportunity: Opportunity) {
  const { key: _key, ...snapshot } = opportunity;
  return {
    user_id: "",
    source: opportunity.source,
    external_id: opportunity.externalId,
    program_id: opportunity.programId,
    title: opportunity.title,
    sponsor: opportunity.sponsor,
    official_url: opportunity.officialUrl,
    deadline: opportunity.deadline?.slice(0, 10) || null,
    snapshot,
  };
}

export function savedRowToOpportunity(row: Tables<"saved_opportunities">): Opportunity {
  const snapshot = row.snapshot && typeof row.snapshot === "object" && !Array.isArray(row.snapshot)
    ? row.snapshot as Record<string, unknown>
    : {};
  return {
    key: opportunityKey(row.source, row.external_id),
    source: row.source === "grants.gov" ? "grants.gov" : "blueprints",
    externalId: row.external_id,
    programId: row.program_id,
    title: row.title,
    sponsor: row.sponsor,
    description: String(snapshot.description || "Saved funding opportunity"),
    officialUrl: row.official_url,
    level: snapshot.level === "LOCAL" || snapshot.level === "STATE" ? snapshot.level : "NATIONAL",
    status: snapshot.status === "forecasted" || snapshot.status === "rolling" || snapshot.status === "closed" ? snapshot.status : "open",
    opensAt: typeof snapshot.opensAt === "string" ? snapshot.opensAt : null,
    deadline: row.deadline,
    postedAt: typeof snapshot.postedAt === "string" ? snapshot.postedAt : null,
    minAmount: typeof snapshot.minAmount === "number" ? snapshot.minAmount : null,
    maxAmount: typeof snapshot.maxAmount === "number" ? snapshot.maxAmount : null,
    state: typeof snapshot.state === "string" ? snapshot.state : null,
    city: typeof snapshot.city === "string" ? snapshot.city : null,
    county: typeof snapshot.county === "string" ? snapshot.county : null,
    industryTags: Array.isArray(snapshot.industryTags) ? snapshot.industryTags.map(String) : [],
    demographics: Array.isArray(snapshot.demographics) ? snapshot.demographics.map(String) : [],
    applicantTypes: Array.isArray(snapshot.applicantTypes) ? snapshot.applicantTypes.map(String) : [],
    eligibilityNotes: typeof snapshot.eligibilityNotes === "string" ? snapshot.eligibilityNotes : "Review the official source.",
    eligibleStates: Array.isArray(snapshot.eligibleStates) ? snapshot.eligibleStates.map(String) : [],
    minEmployees: typeof snapshot.minEmployees === "number" ? snapshot.minEmployees : null,
    maxEmployees: typeof snapshot.maxEmployees === "number" ? snapshot.maxEmployees : null,
    minRevenue: typeof snapshot.minRevenue === "number" ? snapshot.minRevenue : null,
    maxRevenue: typeof snapshot.maxRevenue === "number" ? snapshot.maxRevenue : null,
    sourceName: typeof snapshot.sourceName === "string" ? snapshot.sourceName : row.source,
    sourceKind: typeof snapshot.sourceKind === "string" ? snapshot.sourceKind : "saved snapshot",
    lastVerifiedAt: typeof snapshot.lastVerifiedAt === "string" ? snapshot.lastVerifiedAt : row.updated_at,
    verificationMethod: typeof snapshot.verificationMethod === "string" ? snapshot.verificationMethod : "Saved snapshot",
  };
}
