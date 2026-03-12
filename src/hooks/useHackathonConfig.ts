import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ProblemStatement {
  id: number;
  title: string;
  subtitle: string;
  description: string;
}

export interface Mentor {
  name: string;
  ps: number;
}

export interface HackathonConfig {
  problemStatements: ProblemStatement[];
  mentors: Mentor[];
  judges: string[];
  teamLimit: number;
  leaderboardLive: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultConfig: Omit<HackathonConfig, "loading" | "refetch"> = {
  problemStatements: [],
  mentors: [],
  judges: [],
  teamLimit: 20,
  leaderboardLive: false,
};

export function useHackathonConfig(): HackathonConfig {
  const [config, setConfig] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from("hackathon_config").select("key, value");
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((row: any) => { map[row.key] = row.value; });
      setConfig({
        problemStatements: map.problem_statements || [],
        mentors: map.mentors || [],
        judges: map.judges || [],
        teamLimit: typeof map.team_limit === "number" ? map.team_limit : 20,
        leaderboardLive: map.leaderboard_live === true,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchConfig(); }, []);

  return { ...config, loading, refetch: fetchConfig };
}

export function psNamesFromConfig(ps: ProblemStatement[]): Record<number, string> {
  const map: Record<number, string> = {};
  ps.forEach((p) => { map[p.id] = `${p.title} ${p.subtitle}`.trim(); });
  return map;
}
