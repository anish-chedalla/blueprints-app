-- Replace prototype loan seeds with programs verified against stable, official
-- government or lender-owned pages. Old rows remain for referential history but
-- are hidden from discovery.

UPDATE public.programs
SET
  status = 'CLOSED',
  rolling = false,
  last_verified_at = '2026-09-13T12:00:00-07:00',
  verification_method = 'Unverified legacy loan seed — hidden from discovery'
WHERE type = 'LOAN';

INSERT INTO public.programs (
  type, level, name, sponsor, state, city, county, url, description,
  industry_tags, demographics, min_amount, max_amount, interest_min,
  interest_max, secured, use_cases, deadline, rolling, status, source_id,
  source_name, source_kind, source_url, last_verified_at,
  verification_method, opens_at, applicant_types, eligibility_notes,
  eligible_states, min_employees, max_employees, min_revenue, max_revenue
) VALUES
  (
    'LOAN', 'STATE', 'Arizona Microbusiness Loan Program', 'Arizona Office of Economic Opportunity', 'AZ', NULL, NULL,
    'https://oeo.az.gov/microbiz',
    'Arizona-supported loans of $2,000 to $50,000 delivered through regional lending partners for qualifying microbusinesses with five or fewer employees.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    2000, 50000, NULL, NULL, false, ARRAY['working capital', 'equipment', 'inventory', 'business growth'],
    NULL, true, 'ROLLING', 'azoeo:microbusiness-loan', 'Arizona Office of Economic Opportunity',
    'official_program_page', 'https://oeo.az.gov/microbiz', '2026-09-13T12:00:00-07:00',
    'Official state program page review', NULL, ARRAY['Arizona microbusinesses'],
    'The business must operate in Arizona and have five or fewer employees. A regional lending partner makes the credit decision and sets final terms.',
    ARRAY['AZ'], NULL, 5, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'Arizona Loan Guarantee Program', 'Arizona Commerce Authority', 'AZ', NULL, NULL,
    'https://www.azcommerce.com/ssbci/',
    'Arizona SSBCI loan guarantees help participating community lenders expand financing for eligible Arizona small businesses and nonprofits. Available products and amounts vary by lending partner.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    NULL, NULL, NULL, NULL, false, ARRAY['startup costs', 'working capital', 'equipment', 'inventory', 'place of business'],
    NULL, true, 'ROLLING', 'azcommerce:ssbci-loan-guarantee', 'Arizona Commerce Authority',
    'official_program_page', 'https://www.azcommerce.com/ssbci/', '2026-09-13T12:00:00-07:00',
    'Official state program and partner list review', NULL, ARRAY['Arizona small businesses', 'Eligible Arizona nonprofits'],
    'Apply through one of the participating lenders listed by the Arizona Commerce Authority. The lender determines underwriting, amount, rate, and final eligibility.',
    ARRAY['AZ'], NULL, 750, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'Growth Partners Arizona Microloan', 'Growth Partners Arizona', 'AZ', NULL, NULL,
    'https://www.growthpartnersaz.org/arizona-small-business-loans/',
    'Microloans from $15,000 to $50,000 for established Arizona microbusinesses in the counties listed on the lender’s official program page.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    15000, 50000, NULL, NULL, false, ARRAY['working capital', 'equipment', 'inventory', 'business growth'],
    NULL, true, 'ROLLING', 'growthpartnersaz:microloan', 'Growth Partners Arizona',
    'lender_owned_program_page', 'https://www.growthpartnersaz.org/arizona-small-business-loans/', '2026-09-13T12:00:00-07:00',
    'Lender-owned product page review', NULL, ARRAY['Arizona for-profit microbusinesses'],
    'The official page lists at least one year in business, fewer than five employees, and service-area restrictions. Growth Partners Arizona makes the credit decision and sets final terms.',
    ARRAY['AZ'], NULL, 4, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'Growth Partners Arizona Growth Loan', 'Growth Partners Arizona', 'AZ', NULL, NULL,
    'https://www.growthpartnersaz.org/arizona-small-business-loans/',
    'Growth loans from $51,000 to $150,000 for established Arizona businesses seeking capital for expansion.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    51000, 150000, NULL, NULL, false, ARRAY['working capital', 'equipment', 'expansion'],
    NULL, true, 'ROLLING', 'growthpartnersaz:growth-loan', 'Growth Partners Arizona',
    'lender_owned_program_page', 'https://www.growthpartnersaz.org/arizona-small-business-loans/', '2026-09-13T12:00:00-07:00',
    'Lender-owned product page review', NULL, ARRAY['Arizona for-profit businesses'],
    'The official page lists at least two years in business and at least $50,000 in annual revenue. Growth Partners Arizona makes the credit decision and sets final terms.',
    ARRAY['AZ'], NULL, NULL, 50000, NULL
  ),
  (
    'LOAN', 'NATIONAL', 'SBA 7(a) Loan Program', 'U.S. Small Business Administration', NULL, NULL, NULL,
    'https://www.sba.gov/loans/7a-loans/',
    'The SBA’s primary business loan program supports loans of up to $5 million through participating lenders for eligible uses including working capital, equipment, real estate, and ownership changes.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    NULL, 5000000, NULL, NULL, false, ARRAY['working capital', 'equipment', 'real estate', 'business acquisition'],
    NULL, true, 'ROLLING', 'sba:7a-loans', 'U.S. Small Business Administration',
    'official_program_page', 'https://www.sba.gov/loans/7a-loans/', '2026-09-13T12:00:00-07:00',
    'Official federal program page review', NULL, ARRAY['Operating for-profit small businesses'],
    'The business must operate for profit in the United States, meet SBA size and eligibility rules, be creditworthy, and show a reasonable ability to repay. Apply through a participating lender.',
    ARRAY[]::TEXT[], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'NATIONAL', 'SBA 504 Loan Program', 'U.S. Small Business Administration', NULL, NULL, NULL,
    'https://www.sba.gov/loans/504-loans/',
    'Long-term, fixed-rate financing of up to $5.5 million for qualifying major fixed assets, originated through Certified Development Companies with a senior lender.',
    ARRAY['manufacturing', 'construction', 'services'], ARRAY[]::TEXT[],
    NULL, 5500000, NULL, NULL, true, ARRAY['commercial real estate', 'construction', 'renovation', 'long-term equipment'],
    NULL, true, 'ROLLING', 'sba:504-loans', 'U.S. Small Business Administration',
    'official_program_page', 'https://www.sba.gov/loans/504-loans/', '2026-09-13T12:00:00-07:00',
    'Official federal program page review', NULL, ARRAY['Operating for-profit small businesses'],
    'The business must operate for profit in the United States and meet SBA size and other eligibility requirements. Apply through a Certified Development Company; 504 proceeds generally cannot fund working capital or inventory.',
    ARRAY[]::TEXT[], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'NATIONAL', 'SBA Microloan Program', 'U.S. Small Business Administration', NULL, NULL, NULL,
    'https://www.sba.gov/loans/microloans/',
    'Loans of up to $50,000 delivered through SBA-approved nonprofit intermediaries for small businesses and certain nonprofit childcare centers.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    NULL, 50000, NULL, NULL, false, ARRAY['working capital', 'inventory', 'supplies', 'furniture', 'fixtures', 'equipment'],
    NULL, true, 'ROLLING', 'sba:microloans', 'U.S. Small Business Administration',
    'official_program_page', 'https://www.sba.gov/loans/microloans/', '2026-09-13T12:00:00-07:00',
    'Official federal program page review', NULL, ARRAY['Small businesses', 'Certain nonprofit childcare centers'],
    'An SBA-approved intermediary makes the loan and sets credit requirements. Microloan proceeds cannot be used to pay existing debts or purchase real estate.',
    ARRAY[]::TEXT[], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'NATIONAL', 'SBA Export Finance Programs', 'U.S. Small Business Administration', NULL, NULL, NULL,
    'https://www.sba.gov/counseling/trade-tools-for-international-sales/',
    'SBA-backed export financing options help eligible small businesses fund export development, working capital, and international sales. Product limits and application routes vary.',
    ARRAY['manufacturing', 'technology', 'agriculture', 'transportation'], ARRAY[]::TEXT[],
    NULL, NULL, NULL, NULL, false, ARRAY['export working capital', 'international sales', 'export development'],
    NULL, true, 'ROLLING', 'sba:export-finance', 'U.S. Small Business Administration',
    'official_guidance_page', 'https://www.sba.gov/counseling/trade-tools-for-international-sales/', '2026-09-13T12:00:00-07:00',
    'Official federal export-finance guidance review', NULL, ARRAY['Exporting small businesses'],
    'Choose the appropriate SBA export product and apply through a participating export lender. The lender and SBA determine final eligibility and terms.',
    ARRAY[]::TEXT[], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'NATIONAL', 'USDA Business and Industry Guaranteed Loan', 'USDA Rural Development', NULL, NULL, NULL,
    'https://www.rd.usda.gov/programs-services/business-programs/business-and-industry-guaranteed-loan',
    'A USDA Rural Development guarantee for lender-made loans to eligible businesses and other entities in qualifying rural areas. Lenders submit applications on an ongoing basis.',
    ARRAY['agriculture', 'manufacturing', 'services', 'food service', 'construction'], ARRAY['rural'],
    NULL, NULL, NULL, NULL, true, ARRAY['business development', 'equipment', 'real estate', 'working capital'],
    NULL, true, 'ROLLING', 'usda:business-industry-guarantee', 'USDA Rural Development',
    'official_program_page', 'https://www.rd.usda.gov/programs-services/business-programs/business-and-industry-guaranteed-loan', '2026-09-13T12:00:00-07:00',
    'Official federal program page review', NULL, ARRAY['For-profit businesses', 'Nonprofit businesses', 'Cooperatives', 'Tribes', 'Public bodies', 'Individuals operating a business'],
    'The project must meet USDA rural-area and program requirements. Contact the Arizona Rural Development office and an eligible lender; the lender applies for the guarantee.',
    ARRAY[]::TEXT[], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'CIC Southern Arizona Small Business Loans', 'Community Investment Corporation', 'AZ', NULL, NULL,
    'https://cictucson.org/',
    'Mission-based small-business lending for entrepreneurs in Southern Arizona, including an Arizona SSBCI-supported lending option.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    NULL, 100000, NULL, NULL, false, ARRAY['startup costs', 'working capital', 'equipment', 'business growth'],
    NULL, true, 'ROLLING', 'cictucson:small-business-loans', 'Community Investment Corporation',
    'lender_owned_homepage', 'https://cictucson.org/', '2026-09-13T12:00:00-07:00',
    'Lender-owned page and official Arizona SSBCI partner-list review', NULL, ARRAY['Southern Arizona small businesses'],
    'Service area, product availability, underwriting, rate, and terms must be confirmed directly with Community Investment Corporation.',
    ARRAY['AZ'], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'DreamSpring Arizona Small Business Loans', 'DreamSpring', 'AZ', NULL, NULL,
    'https://www.dreamspring.org/',
    'Mission-based small-business financing available in Arizona. The Arizona Commerce Authority lists DreamSpring as an SSBCI lending partner with products ranging from $1,000 to $2 million.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    1000, 2000000, NULL, NULL, false, ARRAY['startup costs', 'working capital', 'equipment', 'business growth'],
    NULL, true, 'ROLLING', 'dreamspring:arizona-business-loans', 'DreamSpring',
    'lender_owned_homepage', 'https://www.dreamspring.org/', '2026-09-13T12:00:00-07:00',
    'Lender-owned page and official Arizona SSBCI partner-list review', NULL, ARRAY['Arizona small businesses'],
    'Product availability, underwriting, amount, rate, and terms depend on the borrower and are determined by DreamSpring.',
    ARRAY['AZ'], NULL, NULL, NULL, NULL
  ),
  (
    'LOAN', 'STATE', 'Prestamos CDFI Arizona Business Loans', 'Prestamos CDFI', 'AZ', 'Phoenix', NULL,
    'https://prestamoscdfi.org/phoenix/',
    'Community-development business financing in Arizona. The Arizona Commerce Authority lists Prestamos as an SSBCI lending partner with products ranging from $10,000 to $1 million.',
    ARRAY['retail', 'services', 'food service', 'manufacturing', 'technology', 'construction'], ARRAY[]::TEXT[],
    10000, 1000000, NULL, NULL, false, ARRAY['startup costs', 'working capital', 'equipment', 'business growth'],
    NULL, true, 'ROLLING', 'prestamos:arizona-business-loans', 'Prestamos CDFI',
    'lender_owned_location_page', 'https://prestamoscdfi.org/phoenix/', '2026-09-13T12:00:00-07:00',
    'Lender-owned page and official Arizona SSBCI partner-list review', NULL, ARRAY['Arizona small businesses'],
    'Product availability, underwriting, amount, rate, and terms are determined by Prestamos CDFI. Confirm the appropriate Arizona location before applying.',
    ARRAY['AZ'], NULL, NULL, NULL, NULL
  )
ON CONFLICT (source_id) WHERE source_id IS NOT NULL DO UPDATE SET
  level = EXCLUDED.level,
  name = EXCLUDED.name,
  sponsor = EXCLUDED.sponsor,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  county = EXCLUDED.county,
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  industry_tags = EXCLUDED.industry_tags,
  demographics = EXCLUDED.demographics,
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  secured = EXCLUDED.secured,
  use_cases = EXCLUDED.use_cases,
  deadline = EXCLUDED.deadline,
  rolling = EXCLUDED.rolling,
  status = EXCLUDED.status,
  source_name = EXCLUDED.source_name,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  last_verified_at = EXCLUDED.last_verified_at,
  verification_method = EXCLUDED.verification_method,
  applicant_types = EXCLUDED.applicant_types,
  eligibility_notes = EXCLUDED.eligibility_notes,
  eligible_states = EXCLUDED.eligible_states,
  min_employees = EXCLUDED.min_employees,
  max_employees = EXCLUDED.max_employees,
  min_revenue = EXCLUDED.min_revenue,
  max_revenue = EXCLUDED.max_revenue,
  updated_at = now();

-- Expand direct-funder coverage while disclosing fees and automation limits.
INSERT INTO public.grant_sources (
  id, name, homepage_url, coverage, access_method, update_frequency,
  status, is_official, automated, last_checked_at, notes
) VALUES
  (
    'womensnet', 'WomensNet / Amber Grants', 'https://ambergrantsforwomen.com/get-an-amber-grant/',
    'Monthly U.S. and Canadian grants for women-owned businesses', 'Funder-owned program page',
    'Monthly review', 'active', true, false, '2026-09-13T12:00:00-07:00',
    'One application is considered for the applicable monthly grants. The funder charges a $15 application fee and offers fee waivers by email.'
  ),
  (
    'sbir-gov', 'SBIR.gov', 'https://www.sbir.gov/api/solicitation',
    'Federal SBIR and STTR research solicitations for small businesses', 'Official public API',
    'API status review', 'degraded', true, false, '2026-09-13T12:00:00-07:00',
    'The official solicitation API is documented but currently reports that it is undergoing maintenance. Grants.gov remains the live federal search until the service is restored.'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  homepage_url = EXCLUDED.homepage_url,
  coverage = EXCLUDED.coverage,
  access_method = EXCLUDED.access_method,
  update_frequency = EXCLUDED.update_frequency,
  status = EXCLUDED.status,
  is_official = EXCLUDED.is_official,
  automated = EXCLUDED.automated,
  last_checked_at = EXCLUDED.last_checked_at,
  notes = EXCLUDED.notes,
  updated_at = now();

INSERT INTO public.programs (
  type, level, name, sponsor, state, url, description, industry_tags,
  demographics, min_amount, max_amount, deadline, rolling, status, source_id,
  source_name, source_kind, source_url, last_verified_at, verification_method,
  applicant_types, eligibility_notes, eligible_states
) VALUES (
  'GRANT', 'NATIONAL', 'WomensNet Monthly Amber Grants', 'WomensNet', NULL,
  'https://ambergrantsforwomen.com/get-an-amber-grant/',
  'One application makes an eligible women-owned business eligible for the applicable WomensNet monthly awards, including three $10,000 grants each month. Monthly winners are considered for year-end awards.',
  ARRAY['agriculture', 'arts', 'construction', 'education', 'energy', 'food service', 'healthcare', 'hospitality', 'manufacturing', 'retail', 'services', 'sustainability', 'technology', 'transportation'],
  ARRAY['women_owned'], NULL, 10000, NULL, true, 'ROLLING', 'womensnet:amber-grants-2026',
  'WomensNet', 'funder_owned_program_page', 'https://ambergrantsforwomen.com/get-an-amber-grant/',
  '2026-09-13T12:00:00-07:00', 'Funder-owned program page and FAQ review',
  ARRAY['Women age 18 or older with a business that is at least 50% women-owned', 'Revenue-generating nonprofits led by women'],
  'The business must be based in the United States or Canada. The funder charges a $15 application fee; its FAQ says fee waivers can be requested at info@ambergrantsforwomen.com. Applications close on the final day of each month and do not automatically roll into the next month.',
  ARRAY[]::TEXT[]
)
ON CONFLICT (source_id) WHERE source_id IS NOT NULL DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  industry_tags = EXCLUDED.industry_tags,
  demographics = EXCLUDED.demographics,
  max_amount = EXCLUDED.max_amount,
  rolling = EXCLUDED.rolling,
  status = EXCLUDED.status,
  url = EXCLUDED.url,
  source_name = EXCLUDED.source_name,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  last_verified_at = EXCLUDED.last_verified_at,
  verification_method = EXCLUDED.verification_method,
  applicant_types = EXCLUDED.applicant_types,
  eligibility_notes = EXCLUDED.eligibility_notes,
  eligible_states = EXCLUDED.eligible_states,
  updated_at = now();

