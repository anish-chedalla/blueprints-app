-- Real onboarding-completion flag, replacing the business_name-presence inference.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

UPDATE public.profiles
SET onboarding_completed_at = updated_at
WHERE business_name IS NOT NULL
  AND onboarding_completed_at IS NULL;

-- Tracks the guided setup journey that replaces Launch Companion.
-- Per-step completion for the funding/licensing/pipeline steps is derived live from
-- saved_opportunities / licensing_checklist_state rather than duplicated here, so it
-- can never drift from the data that actually represents it.
CREATE TABLE public.journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  blueprint_viewed_at TIMESTAMPTZ,
  banner_dismissed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey progress"
  ON public.journey_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journey progress"
  ON public.journey_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey progress"
  ON public.journey_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_journey_progress_updated_at
  BEFORE UPDATE ON public.journey_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Persists the Licensing page's checklist, which previously only lived in component
-- state and was lost on refresh. step_key matches the stable ids already hardcoded
-- in Licensing.tsx's generateSteps() (state-tpt, city-license, health-permit, etc.).
CREATE TABLE public.licensing_checklist_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_key)
);

ALTER TABLE public.licensing_checklist_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own licensing checklist"
  ON public.licensing_checklist_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own licensing checklist"
  ON public.licensing_checklist_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licensing checklist"
  ON public.licensing_checklist_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_licensing_checklist_state_updated_at
  BEFORE UPDATE ON public.licensing_checklist_state
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
