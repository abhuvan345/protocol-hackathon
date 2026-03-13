import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Trophy } from "lucide-react";
import {
  useHackathonConfig,
  psNamesFromConfig,
} from "@/hooks/useHackathonConfig";

const rubricCategories = [
  "relevance",
  "innovation",
  "usability",
  "performance",
  "impact",
] as const;

const rubricDescriptions: Record<string, Record<number, string>> = {
  relevance: {
    1: "Unrelated or barely connected to the problem statement.",
    2: "Partially related but misses the core issue.",
    3: "Reasonably addresses the problem but lacks depth.",
    4: "Clearly solves the main problem with thoughtful design.",
    5: "Directly targets the core problem with a comprehensive solution.",
  },
  innovation: {
    1: "Very common idea with no originality.",
    2: "Minor tweaks to existing ideas with limited creativity.",
    3: "Some creative elements but still fairly conventional.",
    4: "Creative approach with interesting features.",
    5: "Highly original idea or implementation that stands out.",
  },
  usability: {
    1: "Very confusing interface or extremely difficult to use.",
    2: "Basic interface but noticeable usability issues.",
    3: "Functional and understandable but not polished.",
    4: "User-friendly and intuitive with clear interaction flow.",
    5: "Extremely intuitive, polished, and easy to use.",
  },
  performance: {
    1: "Prototype does not run or core features are broken.",
    2: "Runs but with many bugs or missing features.",
    3: "Core functionality works but the prototype is basic.",
    4: "Works well with good technical implementation.",
    5: "Very stable, efficient, and technically impressive.",
  },
  impact: {
    1: "Little or no real-world usefulness.",
    2: "Limited impact or difficult to apply in real situations.",
    3: "Useful in certain contexts but limited reach.",
    4: "Strong potential for meaningful real-world use.",
    5: "High potential to create significant real-world impact.",
  },
};

const Judges = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const config = useHackathonConfig();
  const psNames = psNamesFromConfig(config.problemStatements);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [topTeams, setTopTeams] = useState<Record<number, any[]>>({});
  const [scoringTeam, setScoringTeam] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [existingScores, setExistingScores] = useState<Record<string, boolean>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedJudge) {
      fetchTopTeams();
      fetchExistingScores();
    }
  }, [selectedJudge, config.problemStatements]);

  const fetchTopTeams = async () => {
    setLoading(true);
    const { data: regs } = await supabase.from("registrations").select("*");
    const { data: mentorScoresData } = await supabase
      .from("mentor_scores")
      .select("*");
    if (!regs || !mentorScoresData) {
      setLoading(false);
      return;
    }

    const teamScores: Record<string, number[]> = {};
    mentorScoresData.forEach((ms: any) => {
      if (!teamScores[ms.team_id]) teamScores[ms.team_id] = [];
      teamScores[ms.team_id].push(ms.total);
    });

    const teamAvg: Record<string, number> = {};
    Object.entries(teamScores).forEach(([teamId, totals]) => {
      const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
      teamAvg[teamId] = (avg / 30) * 25;
    });

    const result: Record<number, any[]> = {};
    config.problemStatements.forEach((ps) => {
      const psTeams = regs
        .filter((r: any) => r.problem_statement === ps.id)
        .map((r: any) => ({ ...r, mentorAvg: teamAvg[r.id] || 0 }))
        .sort((a: any, b: any) => b.mentorAvg - a.mentorAvg)
        .slice(0, 3);
      result[ps.id] = psTeams;
    });

    setTopTeams(result);
    setLoading(false);
  };

  const fetchExistingScores = async () => {
    if (!selectedJudge) return;
    const { data } = await supabase
      .from("judge_scores")
      .select("team_id")
      .eq("judge_name", selectedJudge);
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((s: any) => {
        map[s.team_id] = true;
      });
      setExistingScores(map);
    }
  };

  const openScoring = (team: any) => {
    setScoringTeam(team);
    setScores({});
  };

  const handleSubmitScore = async () => {
    if (!selectedJudge || !scoringTeam) return;
    const allFilled = rubricCategories.every(
      (c) => scores[c] >= 1 && scores[c] <= 5,
    );
    if (!allFilled) {
      toast.error("Please select a score (1-5) for all categories");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("judge_scores").insert({
      judge_name: selectedJudge,
      team_id: scoringTeam.id,
      problem_statement: scoringTeam.problem_statement,
      relevance: scores.relevance,
      innovation: scores.innovation,
      usability: scores.usability,
      performance: scores.performance,
      impact: scores.impact,
    });
    setSubmitting(false);

    if (error) {
      toast.error(
        error.message.includes("unique")
          ? "You have already scored this team!"
          : error.message,
      );
    } else {
      toast.success(`Score submitted for ${scoringTeam.team_name}!`);
      setScoringTeam(null);
      setExistingScores((prev) => ({ ...prev, [scoringTeam.id]: true }));
    }
  };

  const handleLogin = () => {
    if (username === "protocol" && password === "protocol") {
      setLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Invalid credentials");
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full p-6 space-y-4">
          <h1 className="text-xl font-bold text-center">Judge Login</h1>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {loginError && (
            <p className="text-sm text-destructive text-center">{loginError}</p>
          )}
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
          <Link
            to="/"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to form
          </Link>
        </Card>
      </div>
    );
  }

  if (config.loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!selectedJudge) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-2 sm:gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold">Judge Scoring</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-10 max-w-md space-y-6">
          <h2 className="text-2xl font-bold text-center">Select Your Name</h2>
          <div className="grid gap-3">
            {config.judges.map((j) => (
              <Card
                key={j}
                className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all border-2 border-transparent"
                onClick={() => setSelectedJudge(j)}
              >
                <span className="font-semibold">{j}</span>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (scoringTeam) {
    const totalRubric = rubricCategories.reduce(
      (sum, c) => sum + (scores[c] || 0),
      0,
    );
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-start gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setScoringTeam(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold break-words">
                Scoring: {scoringTeam.team_name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Judge: {selectedJudge} | PS {scoringTeam.problem_statement}
              </p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Score</th>
                    {rubricCategories.map((c) => (
                      <th
                        key={c}
                        className="text-left p-3 font-medium capitalize"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <tr
                      key={score}
                      className="border-b border-border last:border-0"
                    >
                      <td className="p-3 font-bold">{score}</td>
                      {rubricCategories.map((cat) => (
                        <td
                          key={cat}
                          onClick={() =>
                            setScores((prev) => ({ ...prev, [cat]: score }))
                          }
                          className={`p-3 cursor-pointer transition-colors text-xs leading-relaxed ${scores[cat] === score ? "bg-primary/20 ring-2 ring-primary/40 font-medium" : "hover:bg-muted/50"}`}
                        >
                          {rubricDescriptions[cat][score]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-base sm:text-lg font-bold">
              Total: <span className="text-primary">{totalRubric}</span>/25
            </div>
            <Button
              onClick={handleSubmitScore}
              disabled={submitting}
              size="lg"
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit Score"}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedJudge(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold break-words">
              Judge: {selectedJudge}
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {loading ? (
          <p className="text-center text-muted-foreground">
            Loading top teams...
          </p>
        ) : (
          config.problemStatements.map((ps) => (
            <div key={ps.id}>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                PS {ps.id} — {psNames[ps.id]}
              </h2>
              {(topTeams[ps.id] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground ml-0 sm:ml-7">
                  No scored teams yet for this PS.
                </p>
              ) : (
                <div className="space-y-2 ml-0 sm:ml-7">
                  {(topTeams[ps.id] || []).map((team, idx) => (
                    <Card
                      key={team.id}
                      className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-lg font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-medium break-words">
                            {team.team_name}
                          </span>
                          <span className="block sm:inline text-xs text-muted-foreground sm:ml-2">
                            (Mentor avg: {team.mentorAvg.toFixed(1)}/25)
                          </span>
                        </div>
                      </div>
                      {existingScores[team.id] ? (
                        <span className="flex items-center gap-1.5 text-sm text-accent">
                          <CheckCircle className="h-4 w-4" /> Scored
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => openScoring(team)}
                        >
                          Score
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Judges;
