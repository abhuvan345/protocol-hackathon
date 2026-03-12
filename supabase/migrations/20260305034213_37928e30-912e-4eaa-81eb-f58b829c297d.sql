
-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  problem_statement INTEGER NOT NULL CHECK (problem_statement IN (1, 2, 3)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read registrations (for counting slots)
CREATE POLICY "Anyone can view registrations" ON public.registrations FOR SELECT USING (true);

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can insert registrations" ON public.registrations FOR INSERT WITH CHECK (true);

-- Create function to enforce 20 limit per problem statement
CREATE OR REPLACE FUNCTION public.check_registration_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.registrations WHERE problem_statement = NEW.problem_statement) >= 20 THEN
    RAISE EXCEPTION 'Registration limit of 20 reached for this problem statement';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_registration_limit
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.check_registration_limit();
