export const LICENSING_BUSINESS_TYPES = ["LLC", "Sole Proprietor", "Corporation", "Partnership", "Nonprofit"];
export const LICENSING_INDUSTRIES = ["technology", "retail", "services", "food service", "sustainability", "biotech", "manufacturing", "healthcare"];

export interface LicensingStepDefinition {
  id: string;
  title: string;
  description: string;
  url: string;
}

interface LicensingRuleInput {
  city: string;
  county: string;
  industry: string;
  businessType: string;
}

export function generateLicensingSteps({ city, county, industry, businessType }: LicensingRuleInput): LicensingStepDefinition[] {
  const steps: LicensingStepDefinition[] = [];

  // State-level requirements
  steps.push({
    id: "state-tpt",
    title: "Register for Arizona Transaction Privilege Tax License",
    description: "Required for all businesses making retail sales in Arizona.",
    url: "https://azdor.gov/transaction-privilege-tax",
  });

  // City-specific requirements
  if (city.toLowerCase() === "phoenix") {
    steps.push({
      id: "city-license",
      title: "Apply for Phoenix Business License",
      description: "All businesses operating within Phoenix city limits must obtain a city business license.",
      url: "https://www.phoenix.gov/pdd/business-license",
    });
  } else if (city) {
    steps.push({
      id: "city-license",
      title: `Apply for ${city} Business License`,
      description: `Contact ${city} city hall for specific business license requirements.`,
      url: "https://az.gov/licensing",
    });
  }

  // County-specific requirements
  if (county.toLowerCase() === "maricopa" && industry === "food service") {
    steps.push({
      id: "health-permit",
      title: "Get Maricopa County Health Permit",
      description: "Required for all food service establishments in Maricopa County.",
      url: "https://www.maricopa.gov/1858/Food-Establishment-Licensing",
    });
  }

  // Industry-specific requirements
  if (industry === "food service") {
    steps.push({
      id: "food-handler",
      title: "Food Handler Certification",
      description: "All food service employees must obtain Arizona Food Handler certification.",
      url: "https://www.azdhs.gov/preparedness/epidemiology-disease-control/food-safety-environmental-services/index.php#food-safety-home",
    });
  }

  if (industry === "healthcare") {
    steps.push({
      id: "healthcare-license",
      title: "Professional Healthcare License",
      description: "Healthcare professionals must be licensed through the Arizona Department of Health Services.",
      url: "https://www.azdhs.gov/licensing/index.php",
    });
  }

  if (industry === "retail" || industry === "food service") {
    steps.push({
      id: "sales-tax",
      title: "Sales Tax Permit",
      description: "Register to collect and remit sales tax on taxable goods and services.",
      url: "https://azdor.gov/licensing",
    });
  }

  // Business structure requirements
  if (businessType === "LLC" || businessType === "Corporation") {
    steps.push({
      id: "acc-registration",
      title: "Register with Arizona Corporation Commission",
      description: "All LLCs and corporations must be registered with the ACC.",
      url: "https://azcc.gov/corporations",
    });
  }

  // General requirements
  steps.push({
    id: "ein",
    title: "Obtain Federal Employer Identification Number (EIN)",
    description: "Required for most businesses, especially those with employees.",
    url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
  });

  return steps;
}
