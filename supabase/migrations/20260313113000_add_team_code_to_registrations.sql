-- Add human-readable team code like 01, 02, 03...
CREATE SEQUENCE IF NOT EXISTS public.registrations_team_code_seq START 1;

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS team_code text;

-- Backfill existing rows with unique codes.
UPDATE public.registrations
SET team_code = LPAD(nextval('public.registrations_team_code_seq')::text, 2, '0')
WHERE team_code IS NULL;

CREATE OR REPLACE FUNCTION public.assign_registration_team_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_code IS NULL OR btrim(NEW.team_code) = '' THEN
    NEW.team_code := LPAD(nextval('public.registrations_team_code_seq')::text, 2, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_registration_team_code ON public.registrations;
CREATE TRIGGER set_registration_team_code
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.assign_registration_team_code();

ALTER TABLE public.registrations
ALTER COLUMN team_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_team_code_key ON public.registrations(team_code);
