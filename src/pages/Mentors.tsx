import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useHackathonConfig, psNamesFromConfig } from "@/hooks/useHackathonConfig";

const rubricCategories = ["relevance", "innovation", "usability", "performance", "impact"] as const;

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

const Mentors = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const config = useHackathonConfig();
  const psNames = psNamesFromConfig(config.problemStatements);
  const [selectedMentor, setSelectedMentor] = useState<{ name: string; ps: number } | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [scoringTeam, setScoringTeam] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [pptScore, setPptScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [existingScores, setExistingScores] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedMentor) { fetchTeams(); fetchExistingScores(); }
  }, [selectedMentor]);

  const fetchTeams = async () => {
    if (!selectedMentor) return;
    const { data } = await supabase.from("registrations").select("*").eq("problem_statement", selectedMentor.ps).order("created_at", { ascending: true });
    if (data) setTeams(data);
  };

  const fetchExistingScores = async () => {
    if (!selectedMentor) return;
    const { data } = await supabase.from("mentor_scores").select("team_id").eq("mentor_name", selectedMentor.name);
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((s: any) => { map[s.team_id] = true; });
      setExistingScores(map);
    }
  };

  const openScoring = (team: any) => { setScoringTeam(team); setScores({}); setPptScore(0); };

  const handleSubmitScore = async () => {
    if (!selectedMentor || !scoringTeam) return;
    const allFilled = rubricCategories.every((c) => scores[c] >= 1 && scores[c] <= 5) && pptScore >= 1 && pptScore <= 5;
    if (!allFilled) { toast.error("Please select a score (1-5) for all categories including PPT"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("mentor_scores").insert({
      mentor_name: selectedMentor.name,
      team_id: scoringTeam.id,
      problem_statement: selectedMentor.ps,
      relevance: scores.relevance,
      innovation: scores.innovation,
      usability: scores.usability,
      performance: scores.performance,
      impact: scores.impact,
      ppt_score: pptScore,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message.includes("unique") ? "You have already scored this team!" : error.message);
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
          <h1 className="text-xl font-bold text-center">Mentor Login</h1>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {loginError && <p className="text-sm text-destructive text-center">{loginError}</p>}
          <Button className="w-full" onClick={handleLogin}>Login</Button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Back to form</Link>
        </Card>
      </div>
    );
  }

  if (config.loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;

  if (!selectedMentor) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <h1 className="text-xl font-bold">Mentor Scoring</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
          <h2 className="text-2xl font-bold text-center">Select Your Name</h2>
          <div className="grid gap-3">
            {config.mentors.map((m) => (
              <Card key={m.name} className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all border-2 border-transparent" onClick={() => setSelectedMentor(m)}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-sm text-muted-foreground">PS {m.ps} — {psNames[m.ps]}</span>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (scoringTeam) {
    const totalRubric = rubricCategories.reduce((sum, c) => sum + (scores[c] || 0), 0);
    const grandTotal = totalRubric + pptScore;

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setScoringTeam(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-xl font-bold">Scoring: {scoringTeam.team_name}</h1>
              <p className="text-sm text-muted-foreground">Mentor: {selectedMentor.name} | PS {selectedMentor.ps}</p>
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
                    {rubricCategories.map((c) => (<th key={c} className="text-left p-3 font-medium capitalize">{c}</th>))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <tr key={score} className="border-b border-border last:border-0">
                      <td className="p-3 font-bold">{score}</td>
                      {rubricCategories.map((cat) => (
                        <td key={cat} onClick={() => setScores((prev) => ({ ...prev, [cat]: score }))}
                          className={`p-3 cursor-pointer transition-colors text-xs leading-relaxed ${scores[cat] === score ? "bg-primary/20 ring-2 ring-primary/40 font-medium" : "hover:bg-muted/50"}`}>
                          {rubricDescriptions[cat][score]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">PPT Score (out of 5)</h3>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Button key={s} variant={pptScore === s ? "default" : "outline"} size="sm" onClick={() => setPptScore(s)}>{s}</Button>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">
              Total: <span className="text-primary">{grandTotal}</span>/30
              <span className="text-sm text-muted-foreground ml-2">(Rubric: {totalRubric}/25 + PPT: {pptScore}/5)</span>
            </div>
            <Button onClick={handleSubmitScore} disabled={submitting} size="lg">{submitting ? "Submitting..." : "Submit Score"}</Button>
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
            <Button variant="ghost" size="icon" onClick={() => setSelectedMentor(null)}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-xl font-bold">{selectedMentor.name}</h1>
              <p className="text-sm text-muted-foreground">PS {selectedMentor.ps} — {psNames[selectedMentor.ps]}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold">Teams to Score</h2>
        {teams.length === 0 ? (
          <p className="text-muted-foreground">No teams registered for this problem statement yet.</p>
        ) : (
          teams.map((team) => (
            <Card key={team.id} className="p-4 flex items-center justify-between">
              <span className="font-medium">{team.team_name}</span>
              {existingScores[team.id] ? (
                <span className="flex items-center gap-1.5 text-sm text-accent"><CheckCircle className="h-4 w-4" /> Scored</span>
              ) : (
                <Button size="sm" onClick={() => openScoring(team)}>Score</Button>
              )}
            </Card>
          ))
        )}
      </main>
    </div>
  );
};

export default Mentors;
