-- Make grant discovery source-aware and let users save any opportunity, including
-- records returned live by Grants.gov that do not live in public.programs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INTEGER CHECK (years_in_business IS NULL OR years_in_business >= 0),
  ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_kind TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_method TEXT,
  ADD COLUMN IF NOT EXISTS opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS applicant_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS eligibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS eligible_states TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_employees INTEGER,
  ADD COLUMN IF NOT EXISTS max_employees INTEGER,
  ADD COLUMN IF NOT EXISTS min_revenue INTEGER,
  ADD COLUMN IF NOT EXISTS max_revenue INTEGER;

UPDATE public.programs
SET
  source_name = COALESCE(source_name, CASE WHEN source_id LIKE 'grants-gov:%' THEN 'Grants.gov' ELSE sponsor END),
  source_kind = COALESCE(source_kind, CASE WHEN source_id LIKE 'grants-gov:%' THEN 'api' ELSE 'curated' END),
  source_url = COALESCE(source_url, url),
  last_verified_at = COALESCE(last_verified_at, updated_at),
  verification_method = COALESCE(verification_method, CASE WHEN source_id LIKE 'grants-gov:%' THEN 'Official API' ELSE 'Official page review' END),
  eligible_states = CASE
    WHEN COALESCE(array_length(eligible_states, 1), 0) = 0 AND state IS NOT NULL THEN ARRAY[state]
    ELSE eligible_states
  END;

-- The original prototype shipped broad sample rows with generic landing-page URLs,
-- invented award ranges, and no stable solicitation identifier. Keep them as
-- history, but do not let them appear as open opportunities in the finder.
UPDATE public.programs
SET
  status = 'CLOSED',
  rolling = false,
  verification_method = 'Unverified legacy seed — hidden from discovery',
  last_verified_at = '2026-09-08T12:00:00-07:00'
WHERE type = 'GRANT'
  AND source_id IS NULL;

CREATE TABLE IF NOT EXISTS public.grant_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  homepage_url TEXT NOT NULL,
  coverage TEXT NOT NULL,
  access_method TEXT NOT NULL,
  update_frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_official BOOLEAN NOT NULL DEFAULT true,
  automated BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grant_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view grant sources"
  ON public.grant_sources FOR SELECT USING (true);

INSERT INTO public.grant_sources (
  id, name, homepage_url, coverage, access_method, update_frequency,
  status, is_official, automated, last_checked_at, notes
) VALUES
  ('grants-gov', 'Grants.gov', 'https://www.grants.gov/search-grants', 'Federal opportunities', 'Public API', 'Live search', 'active', true, true, '2026-09-08T12:00:00-07:00', 'Live keyword and fielded search with official opportunity details.'),
  ('az-commerce', 'Arizona Commerce Authority', 'https://www.azcommerce.com/small-business/', 'Arizona small businesses, innovation, and exporting', 'Official pages', 'Weekly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Includes AZ FAST, AZSTEP, and public funding notices.'),
  ('az-arts', 'Arizona Commission on the Arts', 'https://azarts.gov/grants/', 'Arizona artists and arts organizations', 'Official grant index', 'Weekly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'State grant index with explicit opening and closing dates.'),
  ('az-doa', 'Arizona Department of Administration', 'https://doa.az.gov/about/services/apply-grant', 'State-administered grants for businesses and organizations', 'Official eCivis portal', 'Weekly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Gateway to Arizona grant solicitations administered through eCivis.'),
  ('az-agriculture', 'Arizona Department of Agriculture', 'https://agriculture.az.gov/about-us/divisions/agriculture-food-systems-support/specialty-crop-block-grant-program-scbgp', 'Agriculture and specialty-crop programs', 'Official pages', 'Weekly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Programs are included only when a business or individual can directly apply.'),
  ('az-oeo', 'Arizona Office of Economic Opportunity', 'https://oeo.az.gov/about/funding-opportunities', 'Workforce and microbusiness programs', 'Official funding index', 'Weekly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Closed rounds are retained as source history but not shown as active opportunities.'),
  ('sba', 'U.S. Small Business Administration', 'https://www.sba.gov/loans/additional-funding-opportunities/grants', 'Small-business R&D, exporting, and support programs', 'Official guidance index', 'Monthly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Used to validate whether a program is genuinely open to for-profit small businesses.'),
  ('nase', 'National Association for the Self-Employed', 'https://www.nase.org/business-help/ask-the-experts/growth-grants', 'Rolling private grants for self-employed members nationwide', 'Funder-owned program page', 'Monthly review', 'active', true, false, '2026-09-08T12:00:00-07:00', 'Membership is required. This source adds private small-business coverage and is clearly distinguished from government grants.')
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

CREATE TABLE IF NOT EXISTS public.saved_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  official_url TEXT NOT NULL,
  deadline DATE,
  pipeline_status TEXT NOT NULL DEFAULT 'saved'
    CHECK (pipeline_status IN ('saved', 'researching', 'applying', 'submitted', 'awarded', 'declined')),
  note TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, external_id),
  UNIQUE (id, user_id)
);

ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved opportunities" ON public.saved_opportunities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saved opportunities" ON public.saved_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved opportunities" ON public.saved_opportunities
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved opportunities" ON public.saved_opportunities
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_saved_opportunities_updated_at
  BEFORE UPDATE ON public.saved_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.saved_opportunities (
  user_id, source, external_id, program_id, title, sponsor, official_url,
  deadline, note, snapshot, created_at
)
SELECT
  favorites.user_id,
  'blueprints',
  COALESCE(programs.source_id, programs.id::text),
  programs.id,
  programs.name,
  programs.sponsor,
  programs.url,
  programs.deadline::date,
  favorites.note,
  jsonb_build_object(
    'type', programs.type,
    'level', programs.level,
    'description', programs.description,
    'state', programs.state,
    'city', programs.city,
    'county', programs.county,
    'minAmount', programs.min_amount,
    'maxAmount', programs.max_amount,
    'industryTags', programs.industry_tags,
    'demographics', programs.demographics
  ),
  favorites.created_at
FROM public.favorites
JOIN public.programs ON programs.id = favorites.program_id
ON CONFLICT (user_id, source, external_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.opportunity_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_opportunity_id UUID NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  delivery_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
  email_sent_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, saved_opportunity_id, remind_at),
  FOREIGN KEY (saved_opportunity_id, user_id)
    REFERENCES public.saved_opportunities(id, user_id) ON DELETE CASCADE
);

ALTER TABLE public.opportunity_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own opportunity reminders" ON public.opportunity_reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own opportunity reminders" ON public.opportunity_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own opportunity reminders" ON public.opportunity_reminders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own opportunity reminders" ON public.opportunity_reminders
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  last_result_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved searches" ON public.saved_searches
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saved searches" ON public.saved_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved searches" ON public.saved_searches
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved searches" ON public.saved_searches
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Verified directly against current, funder-owned pages.
INSERT INTO public.programs (
  type, level, name, sponsor, state, url, description, industry_tags,
  demographics, min_amount, max_amount, deadline, rolling, status, source_id,
  source_name, source_kind, source_url, last_verified_at, verification_method,
  opens_at, applicant_types, eligibility_notes, eligible_states, max_employees
) VALUES
  (
    'GRANT', 'STATE', 'AZ FAST Grant - Fall 2026', 'Arizona Commerce Authority', 'AZ',
    'https://www.azcommerce.com/fast-program/',
    'Supports Arizona technology businesses preparing competitive SBIR or STTR proposals. Six applicants may receive up to $3,000 for proposal-development assistance.',
    ARRAY['technology', 'biotech', 'manufacturing'], ARRAY[]::TEXT[], NULL, 3000,
    '2026-10-19T23:59:00-07:00', false, 'OPEN', 'azcommerce:fast-fall-2026',
    'Arizona Commerce Authority', 'curated', 'https://www.azcommerce.com/fast-program/',
    '2026-09-08T12:00:00-07:00', 'Official page review', '2026-09-24T00:00:00-07:00',
    ARRAY['For-profit small businesses'],
    'Must be an organized U.S. for-profit with an Arizona place of business, no more than 500 employees including affiliates, and qualifying U.S. ownership and control under SBIR rules.',
    ARRAY['AZ'], 500
  ),
  (
    'GRANT', 'STATE', 'AZ FAST Grant - Spring 2027', 'Arizona Commerce Authority', 'AZ',
    'https://www.azcommerce.com/fast-program/',
    'Supports Arizona technology businesses preparing competitive SBIR or STTR proposals. Six applicants may receive up to $3,000 for proposal-development assistance.',
    ARRAY['technology', 'biotech', 'manufacturing'], ARRAY[]::TEXT[], NULL, 3000,
    '2027-03-19T23:59:00-07:00', false, 'OPEN', 'azcommerce:fast-spring-2027',
    'Arizona Commerce Authority', 'curated', 'https://www.azcommerce.com/fast-program/',
    '2026-09-08T12:00:00-07:00', 'Official page review', '2027-03-01T00:00:00-07:00',
    ARRAY['For-profit small businesses'],
    'Must be an organized U.S. for-profit with an Arizona place of business, no more than 500 employees including affiliates, and qualifying U.S. ownership and control under SBIR rules.',
    ARRAY['AZ'], 500
  ),
  (
    'GRANT', 'NATIONAL', 'NASE Growth Grant', 'National Association for the Self-Employed', NULL,
    'https://www.nase.org/business-help/ask-the-experts/growth-grants',
    'NASE members may apply on a rolling basis for up to $4,000 for a specific business need such as marketing, hiring, equipment, or expansion. Awards are discretionary and announced quarterly. Membership is required before applying.',
    ARRAY['retail', 'services', 'manufacturing', 'technology'], ARRAY[]::TEXT[], NULL, 4000,
    NULL, true, 'ROLLING', 'nase:growth-grant-2026',
    'National Association for the Self-Employed', 'curated', 'https://www.nase.org/business-help/ask-the-experts/growth-grants',
    '2026-09-08T12:00:00-07:00', 'Funder-owned page review', NULL,
    ARRAY['Self-employed NASE members', 'Sole proprietors', 'LLCs', 'Corporations', 'Partnerships'],
    'Applicant must be an eligible NASE member and follow the member-only application instructions. Membership has a cost; Blueprints does not receive a referral fee and does not rank this opportunity higher because of membership.',
    ARRAY[]::TEXT[], NULL
  )
ON CONFLICT (source_id) WHERE source_id IS NOT NULL DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  source_name = EXCLUDED.source_name,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  last_verified_at = EXCLUDED.last_verified_at,
  verification_method = EXCLUDED.verification_method,
  opens_at = EXCLUDED.opens_at,
  applicant_types = EXCLUDED.applicant_types,
  eligibility_notes = EXCLUDED.eligibility_notes,
  eligible_states = EXCLUDED.eligible_states,
  max_employees = EXCLUDED.max_employees,
  updated_at = now();

-- Add structured, explainable eligibility to previously verified Arizona records.
UPDATE public.programs SET
  source_name = 'Arizona Commission on the Arts',
  source_kind = 'curated',
  source_url = url,
  last_verified_at = '2026-09-08T12:00:00-07:00',
  verification_method = 'Official grant index review',
  applicant_types = ARRAY['Individual artists'],
  eligibility_notes = 'Applicant must be an Arizona resident, an individual artist age 18 or older, and satisfy the cycle-specific restrictions on prior awards and supported activities.',
  eligible_states = ARRAY['AZ']
WHERE source_id = 'azarts:artist-opportunity-fy2027-cycle-b';

UPDATE public.programs SET
  source_name = 'Arizona Commission on the Arts',
  source_kind = 'curated',
  source_url = url,
  last_verified_at = '2026-09-08T12:00:00-07:00',
  verification_method = 'Official announcement review',
  applicant_types = ARRAY['Individual artists'],
  eligibility_notes = 'Applicant must be an Arizona artist age 18 or older and meet the residency program requirements on the official announcement.',
  eligible_states = ARRAY['AZ']
WHERE source_id = 'azarts:state-parks-artist-residency-spring-2027';

UPDATE public.programs SET
  source_name = 'Arizona Registrar of Contractors',
  source_kind = 'curated',
  source_url = url,
  last_verified_at = '2026-09-08T12:00:00-07:00',
  verification_method = 'Official program page and instructions review',
  applicant_types = ARRAY['Individuals', 'Sole proprietors', 'LLCs', 'Corporations', 'Partnerships'],
  eligibility_notes = 'Applicant must satisfy the Arizona R-62 Minor Home Improvement contractor pathway requirements. Entity, qualifying-party, identification, and insurance rules vary; review the official instructions.',
  eligible_states = ARRAY['AZ'],
  industry_tags = ARRAY['construction', 'services']
WHERE source_id = 'azroc:rural-r62-pathway';

UPDATE public.programs SET
  source_name = 'Arizona Commerce Authority',
  source_kind = 'curated',
  source_url = url,
  last_verified_at = '2026-09-08T12:00:00-07:00',
  verification_method = 'Official program page review',
  applicant_types = ARRAY['Arizona small businesses'],
  eligibility_notes = 'The business must be eligible for Arizona STEP export assistance. Supported activities and reimbursement eligibility must be confirmed with the Arizona Commerce Authority international trade team before spending.',
  eligible_states = ARRAY['AZ'],
  max_employees = 500
WHERE source_id = 'azcommerce:azstep';
