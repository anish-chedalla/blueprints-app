-- Private opportunity-view history powers dashboard recents and the History page.
-- Each click is an event so users can review their actual browsing sequence.

CREATE TABLE IF NOT EXISTS public.view_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_key TEXT NOT NULL,
  funding_type TEXT NOT NULL CHECK (funding_type IN ('GRANT', 'LOAN')),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  internal_url TEXT,
  official_url TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS view_history_user_viewed_at_idx
  ON public.view_history (user_id, viewed_at DESC);

ALTER TABLE public.view_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.view_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own history" ON public.view_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.view_history
  FOR DELETE USING (auth.uid() = user_id);

-- Consolidate any loan favorites created by the older UI after the original
-- migration into the shared saved-opportunity model.
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
  COALESCE(programs.source_url, programs.url),
  programs.deadline::date,
  favorites.note,
  jsonb_build_object(
    'fundingType', programs.type,
    'level', programs.level,
    'description', programs.description,
    'status', CASE WHEN programs.rolling THEN 'rolling' ELSE 'open' END,
    'minAmount', programs.min_amount,
    'maxAmount', programs.max_amount,
    'sourceName', COALESCE(programs.source_name, programs.sponsor)
  ),
  favorites.created_at
FROM public.favorites
JOIN public.programs ON programs.id = favorites.program_id
ON CONFLICT (user_id, source, external_id) DO NOTHING;
