-- Enforce per-user AI quotas from service-role edge functions.
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, function_name)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_user_id UUID,
  p_function_name TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resulting_count INTEGER;
BEGIN
  IF p_limit < 1 OR p_function_name = '' THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_rate_limits AS limits (
    user_id, function_name, window_started_at, request_count
  ) VALUES (
    p_user_id, p_function_name, now(), 1
  )
  ON CONFLICT (user_id, function_name) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - interval '1 hour' THEN now()
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= now() - interval '1 hour' THEN 1
      ELSE limits.request_count + 1
    END
  RETURNING request_count INTO resulting_count;

  RETURN resulting_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER) TO service_role;

CREATE POLICY "Users can delete own chats"
  ON public.launch_companion_chats FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.launch_companion_progress FOR DELETE
  USING (auth.uid() = user_id);

UPDATE public.programs
SET status = 'CLOSED'
WHERE deadline < now()
  AND COALESCE(rolling, false) = false
  AND status <> 'CLOSED';

UPDATE public.programs
SET status = 'CLOSED'
WHERE url LIKE 'https://example.com/%';

-- Grants.gov opportunity IDs are stable and avoid destructive URL deduplication.
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS source_id TEXT;
UPDATE public.programs
SET source_id = 'grants-gov:' || substring(url FROM '[?&]oppId=([^&]+)')
WHERE source_id IS NULL
  AND url LIKE 'https://www.grants.gov/%oppId=%';

CREATE UNIQUE INDEX IF NOT EXISTS programs_source_id_unique_idx
  ON public.programs(source_id)
  WHERE source_id IS NOT NULL;

-- The old job called a now-admin-only endpoint with a public anonymous token.
DO $$
BEGIN
  PERFORM cron.unschedule('weekly-grants-sync');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'weekly-grants-sync was not present: %', SQLERRM;
END;
$$;
