-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Schedule weekly grant sync (every Sunday at 2 AM)
SELECT cron.schedule(
  'weekly-grants-sync',
  '0 2 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://ikpcmycxtleodpoojhao.supabase.co/functions/v1/sync-grants',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGNteWN4dGxlb2Rwb29qaGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDcyMTMsImV4cCI6MjA3NjM4MzIxM30.femqpqUOWEZI2IwlJUW6c7DSXTu6G75dyNcIVVQOcZ4"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);