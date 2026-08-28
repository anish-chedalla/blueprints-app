-- Add Arizona opportunities verified against current agency pages on 2026-08-27.
-- Stable source IDs make the migration safe to re-run and easy to refresh later.

INSERT INTO public.programs (
  type,
  level,
  name,
  sponsor,
  state,
  county,
  city,
  url,
  description,
  industry_tags,
  demographics,
  min_amount,
  max_amount,
  deadline,
  rolling,
  status,
  source_id
) VALUES
  (
    'GRANT',
    'STATE',
    'Artist Opportunity Grant - FY2027 Cycle B',
    'Arizona Commission on the Arts',
    'AZ',
    NULL,
    NULL,
    'https://azarts.gov/grant/artist-opportunity/',
    'Arizona artists age 18 or older may request $500 to $1,500 for a time-based opportunity that introduces their work to new audiences, develops skills, or advances their artistic career. Eligible costs include equipment, materials, rentals, travel, registration, and professional services. No match is required.',
    ARRAY['arts', 'services'],
    ARRAY[]::TEXT[],
    500,
    1500,
    '2026-09-24T23:59:00-07:00',
    false,
    'OPEN',
    'azarts:artist-opportunity-fy2027-cycle-b'
  ),
  (
    'GRANT',
    'STATE',
    'Arizona State Parks Artist Residency - Spring 2027',
    'Arizona Commission on the Arts and Arizona State Parks & Trails',
    'AZ',
    NULL,
    NULL,
    'https://azarts.gov/artist-featured/parks-resident/apply-now-arizona-state-parks-artist-residency-2027/',
    'Arizona artists age 18 or older may apply for a two-week Spring 2027 residency at Oracle State Park or Rockin River Ranch State Park. Each selected artist receives a $5,000 stipend, up to $1,000 in reimbursable materials, on-site housing, workspace, and park access.',
    ARRAY['arts', 'sustainability'],
    ARRAY[]::TEXT[],
    5000,
    6000,
    '2026-10-01T23:59:00-07:00',
    false,
    'OPEN',
    'azarts:state-parks-artist-residency-spring-2027'
  ),
  (
    'GRANT',
    'STATE',
    'Rural Arizona Contractor''s Pathway Program',
    'Arizona Registrar of Contractors',
    'AZ',
    NULL,
    NULL,
    'https://roc.az.gov/pathway-program',
    'This currently accepting program covers the initial costs of obtaining an R-62 Minor Home Improvement contractor license for eligible rural Arizona residents and members of Arizona''s 22 federally recognized tribes. Covered steps include the required exam, background check, bond, and initial two-year license when completed through the program.',
    ARRAY['construction', 'services'],
    ARRAY['rural', 'tribal'],
    NULL,
    NULL,
    NULL,
    true,
    'ROLLING',
    'azroc:rural-r62-pathway'
  ),
  (
    'GRANT',
    'STATE',
    'Arizona State Trade Expansion Program (AZSTEP)',
    'Arizona Commerce Authority',
    'AZ',
    NULL,
    NULL,
    'https://www.azcommerce.com/programs/arizona-state-trade-expansion-program/',
    'AZSTEP helps Arizona small businesses enter their first export market or expand into new international markets. Assistance can support trade shows, buyer meetings, trade missions, export planning, U.S. Commercial Service programs, and website localization or translation. Interested companies begin by contacting the Arizona Commerce Authority international trade team.',
    ARRAY['manufacturing', 'technology', 'retail', 'services'],
    ARRAY[]::TEXT[],
    NULL,
    NULL,
    NULL,
    true,
    'ROLLING',
    'azcommerce:azstep'
  )
ON CONFLICT (source_id) WHERE source_id IS NOT NULL DO UPDATE SET
  type = EXCLUDED.type,
  level = EXCLUDED.level,
  name = EXCLUDED.name,
  sponsor = EXCLUDED.sponsor,
  state = EXCLUDED.state,
  county = EXCLUDED.county,
  city = EXCLUDED.city,
  url = EXCLUDED.url,
  description = EXCLUDED.description,
  industry_tags = EXCLUDED.industry_tags,
  demographics = EXCLUDED.demographics,
  min_amount = EXCLUDED.min_amount,
  max_amount = EXCLUDED.max_amount,
  deadline = EXCLUDED.deadline,
  rolling = EXCLUDED.rolling,
  status = EXCLUDED.status,
  updated_at = now();

-- Repair older seed records whose application claims are no longer current.
UPDATE public.programs
SET
  url = 'https://www.azcommerce.com/start-up/arizona-innovation-challenge/',
  description = 'The Fall 2025 Arizona Innovation Challenge is closed. Awardees received at least $50,000 in non-dilutive funding and customized support from the Arizona Commerce Authority.',
  min_amount = 50000,
  max_amount = NULL,
  deadline = '2025-08-11T23:59:00-07:00',
  rolling = false,
  status = 'CLOSED',
  source_id = COALESCE(source_id, 'azcommerce:aic-fall-2025'),
  updated_at = now()
WHERE name = 'Arizona Innovation Challenge';

UPDATE public.programs
SET
  url = 'https://www.azcommerce.com/about-us/public-notices/',
  description = 'The Arizona Commerce Authority currently lists no open Request for Grant Applications for this fund. This record will remain hidden until a verified application window opens.',
  rolling = false,
  status = 'CLOSED',
  source_id = COALESCE(source_id, 'azcommerce:arizona-competes-fund'),
  updated_at = now()
WHERE name = 'Arizona Competes Fund';

UPDATE public.programs
SET
  description = 'The former Arizona Job Training Program is not accepting applications. State budget documents report that funding ended in 2015 and no new grants were issued after 2020.',
  rolling = false,
  status = 'CLOSED',
  source_id = COALESCE(source_id, 'azcommerce:job-training-legacy'),
  updated_at = now()
WHERE name = 'Workforce Development Grant';
