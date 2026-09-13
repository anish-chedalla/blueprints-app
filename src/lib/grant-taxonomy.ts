import type { Opportunity } from "@/lib/opportunities";

const CATEGORY_TERMS: Record<string, string[]> = {
  AG: ["agriculture", "agricultural", "farm", "farming", "crop", "livestock"],
  AR: ["art", "arts", "artist", "creative", "culture", "cultural"],
  BC: ["business", "commerce", "commercial", "entrepreneur", "export", "small business"],
  CD: ["community development", "economic development", "neighborhood", "revitalization"],
  CP: ["consumer protection", "consumer affairs"],
  ED: ["education", "educational", "school", "student", "learning", "training"],
  ELT: ["employment", "workforce", "job training", "apprentice", "apprenticeship"],
  EN: ["energy", "renewable", "solar", "grid", "efficiency", "battery"],
  ENV: ["environment", "environmental", "sustainability", "sustainable", "climate", "conservation", "pollution", "recycling", "green business", "green building"],
  FN: ["food", "nutrition", "hunger", "grocery", "meal"],
  HL: ["health", "healthcare", "medical", "biotech", "clinical", "wellness"],
  HO: ["housing", "homeownership", "homelessness", "affordable homes"],
  ISS: ["income security", "social service", "human service", "public assistance"],
  LJL: ["law", "justice", "legal service", "criminal justice"],
  NR: ["natural resource", "water", "wildlife", "forestry", "forest", "habitat"],
  RD: ["regional development", "rural development", "rural business"],
  ST: ["science", "scientific", "technology", "research", "innovation", "engineering", "stem", "sbir", "sttr"],
  T: ["transportation", "transit", "mobility", "logistics", "infrastructure"],
};

export const INDUSTRY_TERMS: Record<string, string[]> = {
  agriculture: CATEGORY_TERMS.AG,
  arts_creative: CATEGORY_TERMS.AR,
  biotech: ["biotech", "biotechnology", "biomedical", "life science", "clinical research"],
  construction_trades: ["construction", "contractor", "building trade", "skilled trade", "carpentry", "plumbing", "electrician", "hvac"],
  education: CATEGORY_TERMS.ED,
  energy: CATEGORY_TERMS.EN,
  food_service: ["restaurant", "food service", "catering", "culinary", "food and beverage"],
  healthcare: CATEGORY_TERMS.HL,
  hospitality_tourism: ["hospitality", "tourism", "hotel", "travel", "visitor"],
  manufacturing: ["manufacturing", "manufacturer", "factory", "production", "fabrication"],
  retail: ["retail", "storefront", "merchant", "consumer goods"],
  services: ["professional service", "consulting", "business service", "service provider"],
  sustainability: CATEGORY_TERMS.ENV,
  technology: CATEGORY_TERMS.ST,
  transportation_logistics: CATEGORY_TERMS.T,
};

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function includesTerm(text: string, term: string): boolean {
  const normalizedTerm = normalizeText(term);
  return ` ${text} `.includes(` ${normalizedTerm} `);
}

export function opportunitySearchText(opportunity: Opportunity): string {
  return normalizeText([
    opportunity.title,
    opportunity.sponsor,
    opportunity.description,
    opportunity.eligibilityNotes,
    ...opportunity.industryTags,
    ...opportunity.applicantTypes,
  ].join(" "));
}

export function matchesFundingCategory(opportunity: Opportunity, categoryCode: string): boolean {
  if (!categoryCode) return true;
  const terms = CATEGORY_TERMS[categoryCode];
  if (!terms) return true;
  const text = opportunitySearchText(opportunity);
  return terms.some((term) => includesTerm(text, term));
}

export function matchingProfileIndustries(opportunity: Opportunity, profileIndustries: string[]): string[] {
  const text = opportunitySearchText(opportunity);
  return profileIndustries.filter((industry) => {
    const normalized = normalizeText(industry).replace(/ /g, "_");
    const terms = INDUSTRY_TERMS[normalized] ?? [industry];
    return terms.some((term) => includesTerm(text, term));
  });
}

export function isArizonaOpportunity(opportunity: Opportunity): boolean {
  return opportunity.level === "STATE"
    || opportunity.level === "LOCAL"
    || opportunity.state?.toUpperCase() === "AZ"
    || opportunity.eligibleStates.some((state) => state.toUpperCase() === "AZ");
}

export function matchesCuratedApplicantFilter(opportunity: Opportunity, eligibility: string | undefined): boolean {
  if (!eligibility) return true;
  const codes = new Set(eligibility.split("|").filter(Boolean));
  const applicantText = normalizeText(opportunity.applicantTypes.join(" "));
  if (!applicantText) return false;
  const smallBusiness = includesTerm(applicantText, "small business") || includesTerm(applicantText, "small businesses");
  const forProfit = smallBusiness || ["for profit", "business", "businesses", "llc", "llcs", "corporation", "corporations", "partnership", "partnerships", "sole proprietor", "sole proprietors", "self employed"]
    .some((term) => includesTerm(applicantText, term));
  const unrestricted = ["unrestricted", "all applicants", "any applicant"]
    .some((term) => includesTerm(applicantText, term));
  return (codes.has("23") && smallBusiness)
    || (codes.has("22") && forProfit)
    || (codes.has("99") && unrestricted);
}
