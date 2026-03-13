-- Drop the auto-assign trigger and function — team_code is now provided manually by the user at registration.
DROP TRIGGER IF EXISTS set_registration_team_code ON public.registrations;
DROP FUNCTION IF EXISTS public.assign_registration_team_code();
DROP SEQUENCE IF EXISTS public.registrations_team_code_seq;
