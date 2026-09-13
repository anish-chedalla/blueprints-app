export const PROFILE_INDUSTRIES = [
  { value: "agriculture", label: "Agriculture & food" },
  { value: "arts_creative", label: "Arts & creative" },
  { value: "biotech", label: "Biotechnology" },
  { value: "construction_trades", label: "Construction & trades" },
  { value: "education", label: "Education & training" },
  { value: "energy", label: "Energy" },
  { value: "food service", label: "Food service" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hospitality_tourism", label: "Hospitality & tourism" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Professional services" },
  { value: "sustainability", label: "Sustainability & environment" },
  { value: "technology", label: "Technology & R&D" },
  { value: "transportation_logistics", label: "Transportation & logistics" },
] as const;

export const PROFILE_DEMOGRAPHICS = [
  { value: "women_owned", label: "Women-owned" },
  { value: "veteran_owned", label: "Veteran-owned" },
  { value: "minority_owned", label: "Minority-owned" },
  { value: "lgbtq_owned", label: "LGBTQ+-owned" },
  { value: "tribal", label: "Tribal / Native-owned" },
  { value: "rural", label: "Rural business" },
] as const;

export const PROFILE_BUSINESS_TYPES = [
  "LLC",
  "Sole Proprietor",
  "Corporation",
  "Partnership",
  "Nonprofit",
] as const;
