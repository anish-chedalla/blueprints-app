-- Create sync_metadata table to track sync operations
CREATE TABLE IF NOT EXISTS public.sync_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view sync metadata
CREATE POLICY "Anyone can view sync metadata"
ON public.sync_metadata
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_sync_metadata_type_date ON public.sync_metadata(sync_type, last_synced DESC);