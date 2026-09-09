import type { Tables } from "@/integrations/supabase/types";
import type { Opportunity } from "@/lib/opportunities";

export type EligibilityVerdict = "likely" | "possible" | "unlikely" | "profile-needed";

export interface EligibilityResult {
  verdict: EligibilityVerdict;
  score: number;
  reasons: string[];
  cautions: string[];
  missing: string[];
}

export type BusinessProfile = Tables<"profiles">;

const normalize = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");

function applicantFit(profile: BusinessProfile, opportunity: Opportunity, result: EligibilityResult) {
  if (opportunity.applicantTypes.length === 0) {
    result.missing.push("Applicant type must be confirmed on the official listing");
    return;
  }

  const applicantText = opportunity.applicantTypes.join(" ").toLowerCase();
  const profileType = normalize(profile.business_type || "");
  const nonprofit = profileType === "nonprofit";
  const unrestricted = /unrestricted|all applicant/.test(applicantText);
  const businessEligible = /small business|for-profit|business|self-employed|sole proprietor|\bllc\b|corporation|partnership/.test(applicantText);
  const nonprofitEligible = /nonprofit/.test(applicantText);
  const individualEligible = /individual|artist/.test(applicantText);
  const soleProprietor = profileType === "sole_proprietor";

  if (unrestricted || (nonprofit ? nonprofitEligible : businessEligible || (soleProprietor && individualEligible))) {
    result.score += 25;
    result.reasons.push(`${profile.business_type || "Your organization type"} appears in the applicant categories`);
  } else {
    result.score -= 45;
    result.cautions.push(`${profile.business_type || "Your organization type"} is not listed as an eligible applicant type`);
  }
}

export function evaluateEligibility(profile: BusinessProfile | null, opportunity: Opportunity): EligibilityResult {
  const result: EligibilityResult = {
    verdict: profile ? "possible" : "profile-needed",
    score: 50,
    reasons: [],
    cautions: [],
    missing: [],
  };
  if (!profile) {
    result.score = 0;
    result.missing.push("Complete your business profile to calculate a fit explanation");
    return result;
  }

  applicantFit(profile, opportunity, result);

  if (/membership (?:is )?required|must be (?:an? )?.*member/i.test(opportunity.eligibilityNotes)) {
    result.missing.push("Confirm that you meet the funder's membership requirement");
  }

  if (opportunity.eligibleStates.length > 0) {
    if (opportunity.eligibleStates.some((state) => normalize(state) === "az")) {
      result.score += 15;
      result.reasons.push("Your Arizona location matches the geographic requirement");
    } else {
      result.score -= 40;
      result.cautions.push(`This opportunity is limited to ${opportunity.eligibleStates.join(", ")}`);
    }
  } else if (opportunity.level === "NATIONAL") {
    result.score += 5;
    result.reasons.push("The opportunity is national and does not show an Arizona exclusion");
  }

  if (opportunity.county) {
    if (profile.county && normalize(profile.county) === normalize(opportunity.county)) {
      result.score += 15;
      result.reasons.push(`Your ${profile.county} County location matches`);
    } else if (profile.county) {
      result.score -= 35;
      result.cautions.push(`This opportunity is limited to ${opportunity.county} County`);
    } else {
      result.missing.push(`Add your county to check the ${opportunity.county} County requirement`);
    }
  }

  if (opportunity.city) {
    if (profile.city && normalize(profile.city) === normalize(opportunity.city)) {
      result.score += 15;
      result.reasons.push(`Your ${profile.city} location matches`);
    } else if (profile.city) {
      result.score -= 35;
      result.cautions.push(`This opportunity is limited to ${opportunity.city}`);
    } else {
      result.missing.push(`Add your city to check the ${opportunity.city} requirement`);
    }
  }

  if (opportunity.maxEmployees !== null) {
    if (profile.employees === null) {
      result.missing.push(`Add your employee count to check the ${opportunity.maxEmployees}-employee limit`);
    } else if (profile.employees <= opportunity.maxEmployees) {
      result.score += 10;
      result.reasons.push(`Your employee count is within the ${opportunity.maxEmployees}-employee limit`);
    } else {
      result.score -= 45;
      result.cautions.push(`Your employee count exceeds the listed limit of ${opportunity.maxEmployees}`);
    }
  }

  if (opportunity.minRevenue !== null || opportunity.maxRevenue !== null) {
    if (profile.revenue_usd === null) {
      result.missing.push("Add annual revenue to check the revenue requirement");
    } else if (opportunity.minRevenue !== null && profile.revenue_usd < opportunity.minRevenue) {
      result.score -= 30;
      result.cautions.push("Your revenue is below the listed minimum");
    } else if (opportunity.maxRevenue !== null && profile.revenue_usd > opportunity.maxRevenue) {
      result.score -= 30;
      result.cautions.push("Your revenue is above the listed maximum");
    } else {
      result.score += 10;
      result.reasons.push("Your revenue falls within the listed range");
    }
  }

  if (opportunity.demographics.length > 0) {
    const profileDemographics = (profile.demographics || []).map(normalize);
    const matches = opportunity.demographics.filter((item) => profileDemographics.includes(normalize(item)));
    if (matches.length > 0) {
      result.score += 15;
      result.reasons.push("Your business ownership profile matches a targeted applicant group");
    } else {
      result.score -= 35;
      result.cautions.push("This opportunity targets an ownership group not selected in your profile");
    }
  }

  if (opportunity.industryTags.length > 0 && (profile.industry_tags || []).length > 0) {
    const profileIndustries = (profile.industry_tags || []).map(normalize);
    const matches = opportunity.industryTags.filter((tag) => profileIndustries.includes(normalize(tag)));
    if (matches.length > 0) {
      result.score += 15;
      result.reasons.push(`Industry overlap: ${matches.slice(0, 2).join(", ")}`);
    } else {
      result.cautions.push("No direct industry overlap was found; the official description may still allow your project");
    }
  }

  result.score = Math.max(0, Math.min(100, result.score));
  const hardConflict = result.cautions.some((item) => /not listed|limited to|exceeds/.test(item));
  if (hardConflict || result.score < 35) result.verdict = "unlikely";
  else if (result.score >= 70 && result.missing.length === 0) result.verdict = "likely";
  else result.verdict = "possible";
  return result;
}
