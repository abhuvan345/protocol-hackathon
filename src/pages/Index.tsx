import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Users, Trophy, Menu, X } from "lucide-react";
import { useHackathonConfig } from "@/hooks/useHackathonConfig";

const REGISTRATION_STORAGE_KEY = "protocol_registered_team_v1";

type RegisteredTeam = {
  teamName: string;
  problemStatement: number;
  teamCode: string;
};

const accentColors = [
  {
    bar: "#3b82f6",
    glow: "rgba(59,130,246,0.25)",
    border: "rgba(59,130,246,0.6)",
  }, // PS1 – blue
  {
    bar: "#22c55e",
    glow: "rgba(34,197,94,0.25)",
    border: "rgba(34,197,94,0.6)",
  }, // PS2 – green
  {
    bar: "#9b6ee0",
    glow: "rgba(155,110,224,0.25)",
    border: "rgba(155,110,224,0.6)",
  }, // PS3 – purple
  {
    bar: "#a855f7",
    glow: "rgba(168,85,247,0.25)",
    border: "rgba(168,85,247,0.6)",
  },
  {
    bar: "#c084fc",
    glow: "rgba(192,132,252,0.25)",
    border: "rgba(192,132,252,0.6)",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const {
    problemStatements,
    teamLimit,
    loading: configLoading,
  } = useHackathonConfig();
  const [teamName, setTeamName] = useState("");
  const [selectedPS, setSelectedPS] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [registeredTeam, setRegisteredTeam] = useState<RegisteredTeam | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [titleTapCount, setTitleTapCount] = useState(0);
  const titleTapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    fetchCounts();

    const saved = window.localStorage.getItem(REGISTRATION_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as RegisteredTeam;
      if (
        parsed?.teamName &&
        parsed?.teamCode &&
        typeof parsed.problemStatement === "number"
      ) {
        setRegisteredTeam(parsed);
      }
    } catch {
      window.localStorage.removeItem(REGISTRATION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (titleTapTimeoutRef.current) {
        window.clearTimeout(titleTapTimeoutRef.current);
      }
    };
  }, []);

  const handleHiddenAccess = () => {
    if (titleTapTimeoutRef.current) {
      window.clearTimeout(titleTapTimeoutRef.current);
    }

    const nextCount = titleTapCount + 1;
    if (nextCount >= 5) {
      setTitleTapCount(0);
      navigate("/access");
      return;
    }

    setTitleTapCount(nextCount);
    titleTapTimeoutRef.current = window.setTimeout(() => {
      setTitleTapCount(0);
    }, 1500);
  };

  const fetchCounts = async () => {
    const { data } = await supabase
      .from("registrations")
      .select("problem_statement");
    if (data) {
      const c: Record<number, number> = {};
      data.forEach((r: any) => {
        c[r.problem_statement] = (c[r.problem_statement] || 0) + 1;
      });
      setCounts(c);
    }
  };

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    if (!selectedPS) {
      toast.error("Please select a problem statement");
      return;
    }
    if ((counts[selectedPS] || 0) >= teamLimit) {
      toast.error("This problem statement is full!");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        team_name: teamName.trim(),
        problem_statement: selectedPS,
      })
      .select("team_name, problem_statement, team_code")
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(
        error.message.includes("limit")
          ? `This problem statement has reached its limit of ${teamLimit} teams!`
          : error.message,
      );
    } else {
      const registration: RegisteredTeam = {
        teamName: data.team_name,
        problemStatement: data.problem_statement,
        teamCode: data.team_code,
      };
      setRegisteredTeam(registration);
      window.localStorage.setItem(
        REGISTRATION_STORAGE_KEY,
        JSON.stringify(registration),
      );
      toast.success("Registration successful!");
    }
  };

  if (registeredTeam) {
    const selectedProblem = problemStatements.find(
      (ps) => ps.id === registeredTeam.problemStatement,
    );

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "hsl(220,25%,8%)" }}
      >
        <div
          className="max-w-xl w-full p-8 text-center space-y-6 rounded-2xl border"
          style={{
            background: "hsl(220,25%,12%)",
            borderColor: "hsl(220,15%,20%)",
          }}
        >
          <CheckCircle
            className="mx-auto h-16 w-16"
            style={{ color: "#4caf82" }}
          />
          <h1 className="text-2xl font-bold text-white">
            Registration Complete!
          </h1>
          <p className="text-base" style={{ color: "hsl(220,10%,70%)" }}>
            Team{" "}
            <span className="font-semibold text-white">
              {registeredTeam.teamName}
            </span>
          </p>

          <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: "hsl(220,25%,10%)" }}
          >
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "hsl(220,10%,50%)" }}
            >
              Team ID
            </p>
            <p
              className="text-6xl font-extrabold leading-none"
              style={{ color: "#e0436e" }}
            >
              {registeredTeam.teamCode}
            </p>
          </div>

          <div
            className="rounded-xl p-4 space-y-1"
            style={{ background: "hsl(220,25%,10%)" }}
          >
            <p
              className="text-xs uppercase tracking-widest"
              style={{ color: "hsl(220,10%,50%)" }}
            >
              Problem Statement
            </p>
            <p className="text-2xl font-bold text-white">
              PS {registeredTeam.problemStatement}
            </p>
            <p className="text-sm" style={{ color: "hsl(220,10%,65%)" }}>
              {selectedProblem?.title || "Selected Problem Statement"}
            </p>
          </div>

          <p className="text-sm" style={{ color: "hsl(220,10%,50%)" }}>
            You have already registered. This device is locked to your
            registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(220,25%,8%)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid hsl(220,15%,16%)",
          background: "hsl(220,25%,10%)",
        }}
      >
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded hidden sm:inline"
              style={{
                background: "hsl(220,15%,16%)",
                color: "hsl(220,10%,60%)",
              }}
            >
              &gt;&gt;
            </span>
            <h1
              className="text-base sm:text-lg font-bold tracking-wide text-white cursor-default"
              onClick={handleHiddenAccess}
            >
              PROTOCOL <span style={{ color: "#e0436e" }}>HACKATHON</span>
            </h1>
          </div>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              {
                to: "/leaderboard",
                icon: <Trophy className="h-4 w-4" />,
                label: "Leaderboard",
              },
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to}>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all"
                  style={{ color: "hsl(220,10%,60%)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "hsl(220,15%,16%)";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "hsl(220,10%,60%)";
                  }}
                >
                  {icon} {label}
                </button>
              </Link>
            ))}
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-md"
            style={{ color: "hsl(220,10%,60%)" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div
            className="sm:hidden px-4 pb-3 space-y-1"
            style={{ background: "hsl(220,25%,10%)" }}
          >
            {[
              {
                to: "/leaderboard",
                icon: <Trophy className="h-4 w-4" />,
                label: "Leaderboard",
              },
            ].map(({ to, icon, label }) => (
              <Link key={to} to={to} onClick={() => setMobileMenuOpen(false)}>
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm"
                  style={{ color: "hsl(220,10%,70%)" }}
                >
                  {icon} {label}
                </div>
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl space-y-8 sm:space-y-10">
        {/* Hero */}
        <div className="text-center space-y-2 sm:space-y-3">
          <p
            className="text-xs sm:text-sm font-mono tracking-widest uppercase"
            style={{ color: "#e0436e" }}
          >
            Protocol Hackathon 2026
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Choose Your <span style={{ color: "#e0436e" }}>Challenge</span>
          </h2>
          <p
            className="text-sm sm:text-base"
            style={{ color: "hsl(220,10%,55%)" }}
          >
            Select one problem statement for your team. Each PS is limited to{" "}
            {teamLimit} teams.
          </p>
        </div>

        {/* Team Name */}
        <div className="max-w-md mx-auto">
          <label
            className="text-sm font-medium mb-2 block"
            style={{ color: "hsl(220,10%,70%)" }}
          >
            Team Name
          </label>
          <input
            placeholder="Enter your team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full h-11 rounded-lg px-4 text-base outline-none transition-all"
            style={{
              background: "hsl(220,25%,13%)",
              border: "1px solid hsl(220,15%,22%)",
              color: "white",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#e0436e";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(224,67,110,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "hsl(220,15%,22%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Problem Statement Cards */}
        {configLoading ? (
          <p className="text-center" style={{ color: "hsl(220,10%,50%)" }}>
            Loading...
          </p>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {problemStatements.map((ps, idx) => {
              const isFull = (counts[ps.id] || 0) >= teamLimit;
              const isSelected = selectedPS === ps.id;
              const color = accentColors[idx % accentColors.length];
              return (
                <div
                  key={ps.id}
                  onClick={() => !isFull && setSelectedPS(ps.id)}
                  className="rounded-2xl transition-all duration-200 flex flex-col"
                  style={{
                    background: isSelected
                      ? "hsl(220,25%,13%)"
                      : "hsl(220,25%,11%)",
                    border: `1px solid ${isSelected ? color.border : "hsl(220,15%,18%)"}`,
                    boxShadow: isSelected
                      ? `0 0 24px ${color.glow}, 0 4px 20px rgba(0,0,0,0.4)`
                      : "0 2px 12px rgba(0,0,0,0.3)",
                    cursor: isFull ? "not-allowed" : "pointer",
                    opacity: isFull && !isSelected ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isFull && !isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        color.border;
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "hsl(220,15%,18%)";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                    }
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="h-1 rounded-t-2xl"
                    style={{ background: color.bar }}
                  />

                  <div className="p-5 flex flex-col flex-1 gap-4">
                    {/* PS header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{
                            background: "hsl(220,15%,16%)",
                            color: color.bar,
                          }}
                        >
                          PS {ps.id}
                        </span>
                        {isSelected && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: color.glow, color: color.bar }}
                          >
                            ✓ Selected
                          </span>
                        )}
                        {isFull && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(220,38,38,0.15)",
                              color: "#f87171",
                            }}
                          >
                            FULL
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base leading-snug text-white">
                        {ps.title}
                      </h3>
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: color.bar }}
                      >
                        {ps.subtitle}
                      </p>
                    </div>

                    {/* Divider */}
                    <div
                      style={{ height: "1px", background: "hsl(220,15%,18%)" }}
                    />

                    {/* Problem Statement section */}
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-widest mb-2"
                        style={{ color: "hsl(220,10%,45%)" }}
                      >
                        Problem Statement
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "hsl(220,10%,65%)" }}
                      >
                        {ps.description}
                      </p>
                    </div>

                    {/* Challenge section */}
                    {ps.challenge && (
                      <>
                        <div
                          style={{
                            height: "1px",
                            background: "hsl(220,15%,18%)",
                          }}
                        />
                        <div>
                          <p
                            className="text-xs font-semibold uppercase tracking-widest mb-2"
                            style={{ color: color.bar, opacity: 0.8 }}
                          >
                            Challenge
                          </p>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "hsl(220,10%,72%)" }}
                          >
                            {ps.challenge}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-2 flex items-center gap-2 text-sm">
                      <Users
                        className="h-4 w-4"
                        style={{ color: "hsl(220,10%,45%)" }}
                      />
                      <span
                        style={{
                          color: isFull ? "#f87171" : "hsl(220,10%,50%)",
                          fontWeight: isFull ? 600 : 400,
                        }}
                      >
                        {counts[ps.id] || 0}/{teamLimit} teams
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit */}
        <div className="text-center">
          <button
            disabled={!teamName.trim() || !selectedPS || submitting}
            onClick={handleSubmit}
            className="px-12 py-3 rounded-lg font-semibold text-white transition-all duration-200 text-base"
            style={{
              background:
                !teamName.trim() || !selectedPS || submitting
                  ? "hsl(220,15%,20%)"
                  : "linear-gradient(135deg, #e0436e, #c0305a)",
              color:
                !teamName.trim() || !selectedPS || submitting
                  ? "hsl(220,10%,40%)"
                  : "white",
              cursor:
                !teamName.trim() || !selectedPS || submitting
                  ? "not-allowed"
                  : "pointer",
              boxShadow:
                !teamName.trim() || !selectedPS || submitting
                  ? "none"
                  : "0 4px 20px rgba(224,67,110,0.4)",
            }}
          >
            {submitting ? "Submitting..." : "Submit Registration →"}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6 text-xs"
        style={{
          color: "hsl(220,10%,35%)",
          borderTop: "1px solid hsl(220,15%,14%)",
        }}
      >
        Protocol Club · BMSCE CSE © 2026
      </footer>
    </div>
  );
};

export default Index;
