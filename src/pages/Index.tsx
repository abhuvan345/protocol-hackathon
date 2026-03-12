import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CheckCircle, Users, Lock, ClipboardList, Award, Trophy } from "lucide-react";
import { useHackathonConfig } from "@/hooks/useHackathonConfig";

const colorClasses = [
  "bg-[hsl(340,65%,52%)]",
  "bg-[hsl(200,70%,48%)]",
  "bg-[hsl(142,55%,42%)]",
  "bg-[hsl(30,80%,50%)]",
  "bg-[hsl(270,60%,55%)]",
];

const Index = () => {
  const { problemStatements, teamLimit, loading: configLoading } = useHackathonConfig();
  const [teamName, setTeamName] = useState("");
  const [selectedPS, setSelectedPS] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetchCounts(); }, []);

  const fetchCounts = async () => {
    const { data } = await supabase.from("registrations").select("problem_statement");
    if (data) {
      const c: Record<number, number> = {};
      data.forEach((r: any) => { c[r.problem_statement] = (c[r.problem_statement] || 0) + 1; });
      setCounts(c);
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) { toast.error("Please enter a team name"); return; }
    if (!selectedPS) { toast.error("Please select a problem statement"); return; }
    if ((counts[selectedPS] || 0) >= teamLimit) { toast.error("This problem statement is full!"); return; }

    setSubmitting(true);
    const { error } = await supabase.from("registrations").insert({
      team_name: teamName.trim(),
      problem_statement: selectedPS,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message.includes("limit") ? `This problem statement has reached its limit of ${teamLimit} teams!` : error.message);
    } else {
      setSubmitted(true);
      toast.success("Registration successful!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <CheckCircle className="mx-auto h-16 w-16 text-accent" />
          <h1 className="text-2xl font-bold">Registration Complete!</h1>
          <p className="text-muted-foreground">
            Team <span className="font-semibold text-foreground">{teamName}</span> has been registered for Problem Statement {selectedPS}.
          </p>
          <p className="text-sm text-muted-foreground">Your selection cannot be changed.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Hackathon Registration</h1>
          <div className="flex items-center gap-1">
            <Link to="/mentors"><Button variant="ghost" size="sm" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Mentors</Button></Link>
            <Link to="/judges"><Button variant="ghost" size="sm" className="gap-1.5"><Award className="h-4 w-4" /> Judges</Button></Link>
            <Link to="/leaderboard"><Button variant="ghost" size="sm" className="gap-1.5"><Trophy className="h-4 w-4" /> Leaderboard</Button></Link>
            <Link to="/admin"><Button variant="ghost" size="sm" className="gap-1.5"><Lock className="h-4 w-4" /> Admin</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Choose Your Problem Statement</h2>
          <p className="text-muted-foreground">Select one problem statement for your team. Each PS is limited to {teamLimit} teams.</p>
        </div>

        <div className="max-w-md mx-auto">
          <label className="text-sm font-medium mb-2 block">Team Name</label>
          <Input placeholder="Enter your team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="text-base" />
        </div>

        {configLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {problemStatements.map((ps, idx) => {
              const isFull = (counts[ps.id] || 0) >= teamLimit;
              const isSelected = selectedPS === ps.id;
              return (
                <Card
                  key={ps.id}
                  onClick={() => !isFull && setSelectedPS(ps.id)}
                  className={`relative p-5 cursor-pointer transition-all duration-200 border-2 ${
                    isSelected ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : isFull ? "opacity-50 cursor-not-allowed border-border"
                    : "border-transparent hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  <div className={`h-1.5 rounded-full mb-4 ${colorClasses[idx % colorClasses.length]}`} />
                  <h3 className="font-bold text-base leading-snug">
                    {ps.title} <span className="text-muted-foreground font-normal">{ps.subtitle}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ps.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className={isFull ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {counts[ps.id] || 0}/{teamLimit} teams
                    </span>
                    {isFull && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">FULL</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button size="lg" disabled={!teamName.trim() || !selectedPS || submitting} onClick={handleSubmit} className="px-10">
            {submitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Index;
