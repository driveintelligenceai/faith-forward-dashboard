import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import type { SnapshotRating } from '@/types';
import { Save, History, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-score-high';
  if (score >= 4) return 'text-score-mid';
  return 'text-score-low';
}

function getScoreBg(score: number) {
  if (score >= 7) return 'bg-score-high/10 border-score-high/30';
  if (score >= 4) return 'bg-score-mid/10 border-score-mid/30';
  return 'bg-score-low/10 border-score-low/30';
}

export default function Snapshot() {
  const { toast } = useToast();
  const [purposeStatement, setPurposeStatement] = useState(MOCK_SNAPSHOTS[0]?.purposeStatement ?? '');
  const [quarterlyGoal, setQuarterlyGoal] = useState(MOCK_SNAPSHOTS[0]?.quarterlyGoal ?? '');
  const [majorIssue, setMajorIssue] = useState(MOCK_SNAPSHOTS[0]?.majorIssue ?? '');
  const [ratings, setRatings] = useState<Record<string, SnapshotRating>>(() => {
    const initial: Record<string, SnapshotRating> = {};
    SNAPSHOT_CATEGORIES.forEach((cat) => {
      const existing = MOCK_SNAPSHOTS[0]?.ratings.find((r) => r.categoryId === cat.id);
      initial[cat.id] = existing ?? { categoryId: cat.id, score: 5, spouseScore: 5, childScore: 5 };
    });
    return initial;
  });

  const updateRating = (catId: string, field: keyof SnapshotRating, value: number) => {
    setRatings((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [field]: value },
    }));
  };

  const handleSave = () => {
    toast({ title: 'Snapshot Saved', description: 'Your Member Snapshot has been saved successfully.' });
  };

  const personalCategories = SNAPSHOT_CATEGORIES.filter((c) => c.group === 'personal');
  const businessCategories = SNAPSHOT_CATEGORIES.filter((c) => c.group === 'business');

  // History chart data
  const historyData = MOCK_SNAPSHOTS.slice().reverse().map((s) => {
    const row: Record<string, string | number> = { date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) };
    s.ratings.forEach((r) => {
      row[r.categoryId] = r.score;
    });
    return row;
  });

  // Radar chart data
  const radarData = SNAPSHOT_CATEGORIES.map((cat) => ({
    category: cat.name.length > 12 ? cat.name.slice(0, 12) + '…' : cat.name,
    score: ratings[cat.id]?.score ?? 5,
    fullMark: 10,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Member Snapshot™</h1>
          <p className="text-muted-foreground mt-1">
            Rate your last 30 days in each category on a scale of 1–10. Take 20–30 minutes to pause, pray, and reflect honestly.
          </p>
        </div>

        <Tabs defaultValue="snapshot" className="space-y-6">
          <TabsList>
            <TabsTrigger value="snapshot" className="gap-2">
              <Save className="h-4 w-4" /> Current Snapshot
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" /> History
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="space-y-6">
            {/* Header Fields */}
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Purpose Statement</Label>
                  <Textarea
                    value={purposeStatement}
                    onChange={(e) => setPurposeStatement(e.target.value)}
                    placeholder="What is your life purpose?"
                    className="text-base min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Goal for This Quarter</Label>
                  <Textarea
                    value={quarterlyGoal}
                    onChange={(e) => setQuarterlyGoal(e.target.value)}
                    placeholder="What are you focused on this quarter?"
                    className="text-base min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Life */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Life</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {personalCategories.map((cat) => (
                  <Card key={cat.id} className={`border ${getScoreBg(ratings[cat.id]?.score ?? 5)} transition-colors`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{cat.name}</CardTitle>
                          <p className="text-xs text-muted-foreground italic mt-1">{cat.scriptureRef}</p>
                        </div>
                        <span className={`text-3xl font-bold ${getScoreColor(ratings[cat.id]?.score ?? 5)}`}>
                          {ratings[cat.id]?.score ?? 5}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Your Rating</Label>
                        <Slider
                          value={[ratings[cat.id]?.score ?? 5]}
                          onValueChange={([v]) => updateRating(cat.id, 'score', v)}
                          min={1}
                          max={10}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span><span>5 (avg)</span><span>10</span>
                        </div>
                      </div>
                      {cat.hasSpouseRating && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-muted-foreground">Spouse Rating</Label>
                            <span className={`text-lg font-bold ${getScoreColor(ratings[cat.id]?.spouseScore ?? 5)}`}>
                              {ratings[cat.id]?.spouseScore ?? 5}
                            </span>
                          </div>
                          <Slider
                            value={[ratings[cat.id]?.spouseScore ?? 5]}
                            onValueChange={([v]) => updateRating(cat.id, 'spouseScore', v)}
                            min={1}
                            max={10}
                            step={1}
                            className="py-2"
                          />
                        </div>
                      )}
                      {cat.hasChildRating && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-muted-foreground">Child Rating</Label>
                            <span className={`text-lg font-bold ${getScoreColor(ratings[cat.id]?.childScore ?? 5)}`}>
                              {ratings[cat.id]?.childScore ?? 5}
                            </span>
                          </div>
                          <Slider
                            value={[ratings[cat.id]?.childScore ?? 5]}
                            onValueChange={([v]) => updateRating(cat.id, 'childScore', v)}
                            min={1}
                            max={10}
                            step={1}
                            className="py-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Business */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Business</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {businessCategories.map((cat) => (
                  <Card key={cat.id} className={`border ${getScoreBg(ratings[cat.id]?.score ?? 5)} transition-colors`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{cat.name}</CardTitle>
                          <p className="text-xs text-muted-foreground italic mt-1">{cat.scriptureRef}</p>
                        </div>
                        <span className={`text-3xl font-bold ${getScoreColor(ratings[cat.id]?.score ?? 5)}`}>
                          {ratings[cat.id]?.score ?? 5}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Your Rating</Label>
                        <Slider
                          value={[ratings[cat.id]?.score ?? 5]}
                          onValueChange={([v]) => updateRating(cat.id, 'score', v)}
                          min={1}
                          max={10}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span><span>5 (avg)</span><span>10</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Major Issue */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Major Issue for Discussion / Major Prayer Request</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={majorIssue}
                  onChange={(e) => setMajorIssue(e.target.value)}
                  placeholder="What is the biggest issue you're facing right now?"
                  className="text-base min-h-[100px]"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" onClick={handleSave} className="text-base px-8">
                <Save className="h-5 w-5 mr-2" />
                Save Snapshot
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Score Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(211 20% 85%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {SNAPSHOT_CATEGORIES.map((cat, i) => (
                        <Line
                          key={cat.id}
                          type="monotone"
                          dataKey={cat.id}
                          name={cat.name}
                          stroke={`hsl(${(i * 33) % 360} 60% 50%)`}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="radar">
            <Card>
              <CardHeader>
                <CardTitle>Current Snapshot Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="hsl(211 20% 85%)" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(39 66% 47%)"
                        fill="hsl(39 66% 47%)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
