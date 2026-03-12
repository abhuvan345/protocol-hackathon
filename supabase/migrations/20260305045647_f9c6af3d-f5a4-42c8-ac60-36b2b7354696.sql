
-- Mentor scores table
CREATE TABLE public.mentor_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_name text NOT NULL,
  team_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  problem_statement integer NOT NULL,
  relevance integer NOT NULL CHECK (relevance >= 1 AND relevance <= 5),
  innovation integer NOT NULL CHECK (innovation >= 1 AND innovation <= 5),
  usability integer NOT NULL CHECK (usability >= 1 AND usability <= 5),
  performance integer NOT NULL CHECK (performance >= 1 AND performance <= 5),
  impact integer NOT NULL CHECK (impact >= 1 AND impact <= 5),
  ppt_score integer NOT NULL CHECK (ppt_score >= 1 AND ppt_score <= 5),
  total integer GENERATED ALWAYS AS (relevance + innovation + usability + performance + impact + ppt_score) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_name, team_id)
);

ALTER TABLE public.mentor_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert mentor_scores" ON public.mentor_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view mentor_scores" ON public.mentor_scores FOR SELECT USING (true);

-- Judge scores table
CREATE TABLE public.judge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_name text NOT NULL,
  team_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  problem_statement integer NOT NULL,
  relevance integer NOT NULL CHECK (relevance >= 1 AND relevance <= 5),
  innovation integer NOT NULL CHECK (innovation >= 1 AND innovation <= 5),
  usability integer NOT NULL CHECK (usability >= 1 AND usability <= 5),
  performance integer NOT NULL CHECK (performance >= 1 AND performance <= 5),
  impact integer NOT NULL CHECK (impact >= 1 AND impact <= 5),
  total integer GENERATED ALWAYS AS (relevance + innovation + usability + performance + impact) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (judge_name, team_id)
);

ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert judge_scores" ON public.judge_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view judge_scores" ON public.judge_scores FOR SELECT USING (true);
