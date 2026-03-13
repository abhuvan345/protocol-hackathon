import { Link } from "react-router-dom";
import { ArrowLeft, Award, ClipboardList, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const portals = [
  {
    to: "/mentors",
    title: "Mentors",
    description: "Score teams assigned to your problem statement.",
    icon: ClipboardList,
  },
  {
    to: "/judges",
    title: "Judges",
    description: "Review top teams and submit final judging scores.",
    icon: Award,
  },
  {
    to: "/admin",
    title: "Admin",
    description: "Manage registrations, settings, and leaderboard status.",
    icon: Lock,
  },
];

const AccessHub = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-start gap-2 sm:gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">Access Hub</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Open mentor, judge, or admin portal from one place.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link key={portal.to} to={portal.to}>
                <Card className="p-4 sm:p-5 h-full border-2 border-transparent hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold">{portal.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {portal.description}
                    </p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default AccessHub;
