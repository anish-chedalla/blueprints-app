-- Create enums
CREATE TYPE program_type AS ENUM ('GRANT', 'LOAN');
CREATE TYPE program_level AS ENUM ('LOCAL', 'STATE', 'NATIONAL');
CREATE TYPE program_status AS ENUM ('OPEN', 'ROLLING', 'CLOSED');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT,
  county TEXT,
  city TEXT,
  industry_tags TEXT[] DEFAULT '{}',
  employees INT,
  revenue_usd INT,
  demographics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type program_type NOT NULL,
  level program_level NOT NULL,
  name TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  state TEXT,
  city TEXT,
  county TEXT,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  industry_tags TEXT[] DEFAULT '{}',
  demographics TEXT[] DEFAULT '{}',
  min_amount INT,
  max_amount INT,
  interest_min DECIMAL(5,2),
  interest_max DECIMAL(5,2),
  secured BOOLEAN,
  use_cases TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  rolling BOOLEAN DEFAULT false,
  status program_status DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for programs (public read)
CREATE POLICY "Anyone can view programs"
  ON public.programs FOR SELECT
  USING (true);

-- RLS Policies for favorites
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for applications
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert seed data
INSERT INTO public.programs (type, level, name, sponsor, state, url, description, industry_tags, demographics, min_amount, max_amount, deadline, rolling, status) VALUES
('GRANT', 'STATE', 'Arizona Innovation Challenge', 'Arizona Commerce Authority', 'AZ', 'https://example.com/aic', 'State program supporting high-potential startups in Arizona.', ARRAY['technology'], ARRAY[]::TEXT[], 10000, 150000, '2025-11-30T00:00:00.000Z', false, 'OPEN'),
('LOAN', 'STATE', 'Arizona Microbusiness Loan Program', 'CDFI partners', 'AZ', 'https://example.com/az-microloan', 'Loans for AZ microbusinesses with 5 or fewer employees.', ARRAY['retail','services'], ARRAY[]::TEXT[], 2000, 50000, NULL, true, 'OPEN'),
('LOAN', 'LOCAL', 'Local First Arizona Green Loan', 'Local First Arizona', 'AZ', 'https://example.com/lfa-green', 'Up to 25k for environmental improvements for small businesses.', ARRAY['food service','sustainability'], ARRAY[]::TEXT[], 5000, 25000, NULL, true, 'OPEN'),
('GRANT', 'NATIONAL', 'SBIR Phase I', 'US Federal – multiple agencies', NULL, 'https://example.com/sbir', 'R&D grant for small businesses pursuing federal research objectives.', ARRAY['technology','biotech'], ARRAY[]::TEXT[], 50000, 275000, '2026-01-15T00:00:00.000Z', false, 'OPEN');

-- Update seed data with loan-specific fields
UPDATE public.programs 
SET interest_min = 4.5, interest_max = 12.0, secured = false, use_cases = ARRAY['working capital','equipment']
WHERE name = 'Arizona Microbusiness Loan Program';

UPDATE public.programs 
SET interest_min = 3.0, interest_max = 8.0, secured = false, use_cases = ARRAY['equipment','energy upgrades']
WHERE name = 'Local First Arizona Green Loan';