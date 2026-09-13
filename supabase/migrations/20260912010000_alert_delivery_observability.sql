-- Keep a user-visible audit trail for transactional grant-alert emails. Writes
-- are intentionally service-role only; authenticated users may read their own rows.

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_email_error TEXT;

ALTER TABLE public.opportunity_reminders
  ADD COLUMN IF NOT EXISTS email_error TEXT;

CREATE TABLE IF NOT EXISTS public.alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('saved_search', 'reminder')),
  reference_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_message_id TEXT UNIQUE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN (
    'accepted', 'sent', 'delivered', 'delivery_delayed', 'bounced', 'failed',
    'suppressed', 'complained', 'opened', 'clicked'
  )),
  error_message TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alert_deliveries_user_created_idx
  ON public.alert_deliveries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS alert_deliveries_pending_status_idx
  ON public.alert_deliveries (status)
  WHERE provider_message_id IS NOT NULL;

ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert deliveries"
  ON public.alert_deliveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER set_alert_deliveries_updated_at
  BEFORE UPDATE ON public.alert_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

