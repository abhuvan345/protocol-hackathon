import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useHackathonConfig, psNamesFromConfig } from "@/hooks/useHackathonConfig";
import { Trophy, Medal, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TeamScore {
  id: string;
  team_name: string;
  problem_statement: number;
  mentorAvg25: number;
}

const Leaderboard = () => {
  const config = useHackathonConfig();
  const psNames = psNamesFromConfig(config.problemStatements);
  const [teams, setTeams] = useState<TeamScore[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [config.loading]);

  const fetchData = async () => {
    setLoading(true);
    const [regRes, msRes, cfgRes] = await Promise.all([
      supabase.from("registrations").select("*"),
      supabase.from("mentor_scores").select("*"),
      supabase.from("hackathon_config").select("key, value").eq("key", "leaderboard_live").single(),
    ]);

    const live = cfgRes.data?.value === true;
    setIsLive(live);

    if (!live) { setLoading(false); return; }

    const regs = regRes.data || [];
    const scores = msRes.data || [];

    // Calculate mentor avg per team, normalized to 25
    const mentorByTeam: Record<string, { total: number; count: number }> = {};
    scores.forEach((s: any) => {
      if (!mentorByTeam[s.team_id]) mentorByTeam[s.team_id] = { total: 0, count: 0 };
      mentorByTeam[s.team_id].total += s.total;
      mentorByTeam[s.team_id].count++;
    });

    const teamScores: TeamScore[] = regs.map((r: any) => {
      const m = mentorByTeam[r.id];
      const mentorAvg25 = m ? (m.total / m.count / 30) * 25 : 0;
      return { id: r.id, team_name: r.team_name, problem_statement: r.problem_statement, mentorAvg25 };
    });

    teamScores.sort((a, b) => b.mentorAvg25 - a.mentorAvg25);
    setTeams(teamScores);
    setLoading(false);
  };

  if (loading || config.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <Trophy className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Leaderboard Not Available</h1>
          <p className="text-muted-foreground">The leaderboard will be visible once the admin makes it live.</p>
          <Link to="/"><Button variant="outline">← Back to Home</Button></Link>
        </Card>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-primary" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Award className="h-5 w-5 text-accent-foreground" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Leaderboard
          </h1>
          <Link to="/"><Button variant="ghost" size="sm">← Back</Button></Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <p className="text-center text-muted-foreground text-sm mb-6">
          Rankings based on mentor evaluation scores (out of 25)
        </p>

        {teams.map((t, i) => {
          const rank = i + 1;
          const isTop9 = rank <= 9;
          return (
            <Card
              key={t.id}
              className={`p-4 flex items-center gap-4 transition-all ${
                isTop9
                  ? "border-2 border-primary/40 bg-primary/5 shadow-md"
                  : "border border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                rank <= 3 ? "bg-primary text-primary-foreground" : isTop9 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {rank}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{t.team_name}</span>
                  {getRankIcon(rank)}
                  {isTop9 && rank > 3 && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Top 9</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PS {t.problem_statement} — {psNames[t.problem_statement] || ""}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-bold text-primary">{t.mentorAvg25.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/25</span>
              </div>
            </Card>
          );
        })}

        {teams.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No scores available yet.</p>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
