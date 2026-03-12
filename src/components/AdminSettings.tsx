import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { ProblemStatement, Mentor } from "@/hooks/useHackathonConfig";

interface Props {
  problemStatements: ProblemStatement[];
  mentors: Mentor[];
  judges: string[];
  teamLimit: number;
  onSaved: () => void;
}

const AdminSettings = ({ problemStatements, mentors, judges, teamLimit, onSaved }: Props) => {
  const [ps, setPs] = useState<ProblemStatement[]>(problemStatements);
  const [mList, setMList] = useState<Mentor[]>(mentors);
  const [jList, setJList] = useState<string[]>(judges);
  const [limit, setLimit] = useState(teamLimit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPs(problemStatements);
    setMList(mentors);
    setJList(judges);
    setLimit(teamLimit);
  }, [problemStatements, mentors, judges, teamLimit]);

  const updateConfig = async (key: string, value: any) => {
    const { error } = await supabase
      .from("hackathon_config")
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    if (error) throw error;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfig("problem_statements", ps),
        updateConfig("mentors", mList),
        updateConfig("judges", jList),
        updateConfig("team_limit", limit),
      ]);
      toast.success("Settings saved!");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const updatePS = (idx: number, field: keyof ProblemStatement, val: string | number) => {
    setPs((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const addPS = () => {
    const nextId = ps.length > 0 ? Math.max(...ps.map((p) => p.id)) + 1 : 1;
    setPs([...ps, { id: nextId, title: "", subtitle: "", description: "" }]);
  };

  const removePS = (idx: number) => setPs((prev) => prev.filter((_, i) => i !== idx));

  const updateMentor = (idx: number, field: keyof Mentor, val: string | number) => {
    setMList((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));
  };

  const addMentor = () => setMList([...mList, { name: "", ps: 1 }]);
  const removeMentor = (idx: number) => setMList((prev) => prev.filter((_, i) => i !== idx));

  const updateJudge = (idx: number, val: string) => {
    setJList((prev) => prev.map((j, i) => i === idx ? val : j));
  };

  const addJudge = () => setJList([...jList, ""]);
  const removeJudge = (idx: number) => setJList((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      {/* Team Limit */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Team Limit per Problem Statement</h3>
        <Input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="w-32"
          min={1}
        />
      </Card>

      {/* Problem Statements */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Problem Statements</h3>
          <Button size="sm" variant="outline" onClick={addPS}><Plus className="h-4 w-4 mr-1" />Add PS</Button>
        </div>
        {ps.map((p, i) => (
          <div key={i} className="border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground w-12">PS {p.id}</span>
              <Input placeholder="Title" value={p.title} onChange={(e) => updatePS(i, "title", e.target.value)} className="flex-1" />
              <Input placeholder="Subtitle" value={p.subtitle} onChange={(e) => updatePS(i, "subtitle", e.target.value)} className="w-40" />
              <Button size="icon" variant="ghost" onClick={() => removePS(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <Input placeholder="Description" value={p.description} onChange={(e) => updatePS(i, "description", e.target.value)} />
          </div>
        ))}
      </Card>

      {/* Mentors */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Mentors</h3>
          <Button size="sm" variant="outline" onClick={addMentor}><Plus className="h-4 w-4 mr-1" />Add Mentor</Button>
        </div>
        {mList.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Mentor name" value={m.name} onChange={(e) => updateMentor(i, "name", e.target.value)} className="flex-1" />
            <select
              value={m.ps}
              onChange={(e) => updateMentor(i, "ps", Number(e.target.value))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ps.map((p) => (
                <option key={p.id} value={p.id}>PS {p.id}</option>
              ))}
            </select>
            <Button size="icon" variant="ghost" onClick={() => removeMentor(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </Card>

      {/* Judges */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Judges</h3>
          <Button size="sm" variant="outline" onClick={addJudge}><Plus className="h-4 w-4 mr-1" />Add Judge</Button>
        </div>
        {jList.map((j, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input placeholder="Judge name" value={j} onChange={(e) => updateJudge(i, e.target.value)} className="flex-1" />
            <Button size="icon" variant="ghost" onClick={() => removeJudge(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
};

export default AdminSettings;
