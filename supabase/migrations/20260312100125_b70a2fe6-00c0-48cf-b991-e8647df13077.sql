
CREATE TABLE public.hackathon_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.hackathon_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view config" ON public.hackathon_config FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update config" ON public.hackathon_config FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert config" ON public.hackathon_config FOR INSERT TO public WITH CHECK (true);

-- Seed default config
INSERT INTO public.hackathon_config (key, value) VALUES
('problem_statements', '[{"id":1,"title":"Mental Health Micro-Support System","subtitle":"for Students","description":"Design a digital micro-support system that provides students with immediate, low-barrier emotional support — mood tracking, peer support, AI journaling, and more."},{"id":2,"title":"Public Issue Reporting & Resolution","subtitle":"Tracker","description":"Design a platform that improves how public issues are reported, monitored, and resolved — citizen reporting, admin dashboards, real-time tracking."},{"id":3,"title":"Farmer-to-Consumer Direct","subtitle":"Marketplace","description":"Design a digital solution that helps farmers connect directly with buyers — marketplace apps, subscription delivery, price transparency tools."}]'),
('team_limit', '20'),
('mentors', '[{"name":"Sam","ps":1},{"name":"Aaron","ps":1},{"name":"Parth","ps":1},{"name":"Bhuvan A","ps":2},{"name":"Akshay S","ps":2},{"name":"Sanath S","ps":2},{"name":"Kushi","ps":3},{"name":"Subramanya","ps":3},{"name":"Shailesh","ps":3}]'),
('judges', '["Dr. Kayarvizhy N","Dr. Pallavi G B","Dr. Shyamala G"]');
