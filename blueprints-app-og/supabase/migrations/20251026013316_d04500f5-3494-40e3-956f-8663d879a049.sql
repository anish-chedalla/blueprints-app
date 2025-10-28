-- Create launch_companion_chats table for storing conversation history
CREATE TABLE public.launch_companion_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create launch_companion_progress table for tracking user's journey
CREATE TABLE public.launch_companion_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  business_type TEXT,
  business_location TEXT,
  current_phase TEXT NOT NULL DEFAULT 'plan' CHECK (current_phase IN ('plan', 'register', 'license', 'finance', 'operate')),
  phase_data JSONB DEFAULT '{}',
  checklist_items JSONB DEFAULT '[]',
  completed_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Enable Row Level Security
ALTER TABLE public.launch_companion_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launch_companion_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view own chats" 
  ON public.launch_companion_chats 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" 
  ON public.launch_companion_chats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for progress
CREATE POLICY "Users can view own progress" 
  ON public.launch_companion_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress" 
  ON public.launch_companion_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
  ON public.launch_companion_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_launch_companion_progress_updated_at
  BEFORE UPDATE ON public.launch_companion_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_launch_companion_chats_user_session 
  ON public.launch_companion_chats(user_id, session_id, created_at DESC);

CREATE INDEX idx_launch_companion_progress_user_session 
  ON public.launch_companion_progress(user_id, session_id);