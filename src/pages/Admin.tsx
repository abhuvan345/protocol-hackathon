import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, RefreshCw, Settings, Globe, WifiOff } from "lucide-react";
import { useHackathonConfig, psNamesFromConfig } from "@/hooks/useHackathonConfig";
import AdminSettings from "@/components/AdminSettings";
import { toast } from "sonner";

const Admin = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [mentorScores, setMentorScores] = useState<any[]>([]);
  const [judgeScores, setJudgeScores] = useState<any[]>([]);
  const [filter, setFilter] = useState<number | null>(null);
  const [tab, setTab] = useState<"registrations" | "scores" | "settings">("registrations");
  const config = useHackathonConfig();
  const psNames = psNamesFromConfig(config.problemStatements);

  const handleLogin = () => {
    if (username === "admin" && password === "admin") {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  useEffect(() => {
    if (loggedIn) fetchAll();
  }, [loggedIn]);

  const fetchAll = async () => {
    const [r, ms, js] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: true }),
      supabase.from("mentor_scores").select("*"),
      supabase.from("judge_scores").select("*"),
    ]);
    if (r.data) setRegistrations(r.data);
    if (ms.data) setMentorScores(ms.data);
    if (js.data) setJudgeScores(js.data);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full p-6 space-y-4">
          <h1 className="text-xl font-bold text-center">Admin Login</h1>
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <Button className="w-full" onClick={handleLogin}>Login</Button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Back to form</Link>
        </Card>
      </div>
    );
  }

  const filtered = filter ? registrations.filter((r) => r.problem_statement === filter) : registrations;
  const counts: Record<number, number> = {};
  config.problemStatements.forEach((p) => { counts[p.id] = 0; });
  registrations.forEach((r) => { counts[r.problem_statement] = (counts[r.problem_statement] || 0) + 1; });

  // Mentor averages
  const mentorAvgByTeam: Record<string, { avg: number; count: number; mentors: any[] }> = {};
  mentorScores.forEach((ms) => {
    if (!mentorAvgByTeam[ms.team_id]) mentorAvgByTeam[ms.team_id] = { avg: 0, count: 0, mentors: [] };
    mentorAvgByTeam[ms.team_id].count++;
    mentorAvgByTeam[ms.team_id].mentors.push(ms);
  });
  Object.keys(mentorAvgByTeam).forEach((tid) => {
    const entry = mentorAvgByTeam[tid];
    const totalSum = entry.mentors.reduce((s: number, m: any) => s + m.total, 0);
    entry.avg = (totalSum / entry.count / 30) * 25;
  });

  // Judge totals
  const judgeTotalByTeam: Record<string, { total: number; count: number; judges: any[] }> = {};
  judgeScores.forEach((js) => {
    if (!judgeTotalByTeam[js.team_id]) judgeTotalByTeam[js.team_id] = { total: 0, count: 0, judges: [] };
    judgeTotalByTeam[js.team_id].total += js.total;
    judgeTotalByTeam[js.team_id].count++;
    judgeTotalByTeam[js.team_id].judges.push(js);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={config.leaderboardLive ? "destructive" : "default"}
              size="sm"
              onClick={async () => {
                const newVal = !config.leaderboardLive;
                const { error } = await supabase
                  .from("hackathon_config")
                  .update({ value: newVal, updated_at: new Date().toISOString() } as any)
                  .eq("key", "leaderboard_live");
                if (error) { toast.error("Failed to toggle"); return; }
                toast.success(newVal ? "Leaderboard is now LIVE!" : "Leaderboard is now offline");
                config.refetch();
              }}
            >
              {config.leaderboardLive ? <WifiOff className="h-4 w-4 mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
              {config.leaderboardLive ? "Go Offline" : "Go Online"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchAll(); config.refetch(); }}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={() => setLoggedIn(false)}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          {config.problemStatements.map((ps) => (
            <Card
              key={ps.id}
              className={`p-4 cursor-pointer transition-all border-2 ${filter === ps.id ? "border-primary" : "border-transparent hover:border-primary/30"}`}
              onClick={() => setFilter(filter === ps.id ? null : ps.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PS {ps.id}</p>
                  <p className="font-semibold text-sm mt-1">{psNames[ps.id]}</p>
                </div>
                <div className="flex items-center gap-1.5 text-lg font-bold">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  {counts[ps.id] || 0}/{config.teamLimit}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button variant={tab === "registrations" ? "default" : "outline"} size="sm" onClick={() => setTab("registrations")}>Registrations</Button>
          <Button variant={tab === "scores" ? "default" : "outline"} size="sm" onClick={() => setTab("scores")}>All Scores</Button>
          <Button variant={tab === "settings" ? "default" : "outline"} size="sm" onClick={() => setTab("settings")}>
            <Settings className="h-4 w-4 mr-1" /> Settings
          </Button>
        </div>

        {tab === "registrations" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Team Name</th>
                    <th className="text-left p-3 font-medium">PS</th>
                    <th className="text-left p-3 font-medium">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No registrations yet</td></tr>
                  ) : (
                    filtered.map((r, i) => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground">{i + 1}</td>
                        <td className="p-3 font-medium">{r.team_name}</td>
                        <td className="p-3">PS {r.problem_statement}</td>
                        <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "scores" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Team</th>
                    <th className="text-left p-3 font-medium">PS</th>
                    <th className="text-left p-3 font-medium">Mentor Avg (/25)</th>
                    <th className="text-left p-3 font-medium">Mentor Details</th>
                    <th className="text-left p-3 font-medium">Judge Total (/75)</th>
                    <th className="text-left p-3 font-medium">Judge Details</th>
                    <th className="text-left p-3 font-medium">Grand Total (/100)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No teams</td></tr>
                  ) : (
                    filtered.map((r, i) => {
                      const ma = mentorAvgByTeam[r.id];
                      const jt = judgeTotalByTeam[r.id];
                      const mentorVal = ma ? ma.avg : 0;
                      const judgeVal = jt ? jt.total : 0;
                      const grand = mentorVal + judgeVal;
                      return (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{r.team_name}</td>
                          <td className="p-3">PS {r.problem_statement}</td>
                          <td className="p-3 font-semibold">{ma ? ma.avg.toFixed(1) : "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {ma ? ma.mentors.map((m: any) => `${m.mentor_name}: ${m.total}/30`).join(", ") : "—"}
                          </td>
                          <td className="p-3 font-semibold">{jt ? jt.total : "—"}</td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {jt ? jt.judges.map((j: any) => `${j.judge_name}: ${j.total}/25`).join(", ") : "—"}
                          </td>
                          <td className="p-3 font-bold text-primary">{(ma || jt) ? grand.toFixed(1) : "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "settings" && (
          <AdminSettings
            problemStatements={config.problemStatements}
            mentors={config.mentors}
            judges={config.judges}
            teamLimit={config.teamLimit}
            onSaved={() => config.refetch()}
          />
        )}

        <p className="text-center text-sm text-muted-foreground">Total registrations: {registrations.length}</p>
      </main>
    </div>
  );
};

export default Admin;
