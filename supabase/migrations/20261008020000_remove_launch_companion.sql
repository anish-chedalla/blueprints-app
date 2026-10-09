-- Launch Companion (the AI chat "startup journey" feature) is deprecated and replaced
-- by the journey_progress-backed guided journey added in the prior migration.
-- No other table has a foreign key into either of these, so a plain drop is safe;
-- their RLS policies, triggers, and indexes are dropped automatically with them.
DROP TABLE IF EXISTS public.launch_companion_chats;
DROP TABLE IF EXISTS public.launch_companion_progress;
