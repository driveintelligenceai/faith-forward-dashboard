import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import type { SnapshotRating } from '@/types';
import { Save, History, BarChart3, BookOpen } from 'lucide-react';
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
  if (score >= 7) return 'border-l-4 border-l-score-high';
  if (score >= 4) return 'border-l-4 border-l-score-mid';
  return 'border-l-4 border-l-score-low';
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

  const historyData = MOCK_SNAPSHOTS.slice().reverse().map((s) => {
    const row: Record<string, string | number> = {
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    };
    s.ratings.forEach((r) => {
      row[r.categoryId] = r.score;
    });
    return row;
  });

  const radarData = SNAPSHOT_CATEGORIES.map((cat) => ({
    category: cat.name.length > 14 ? cat.name.slice(0, 14) + '…' : cat.name,
    score: ratings[cat.id]?.score ?? 5,
    fullMark: 10,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            Member Snapshot™
          </h1>
          <p className="text-base font-body text-muted-foreground mt-2 max-w-2xl">
            Rate your last 30 days in each category on a scale of 1–10, where 5 is average and 10 is the best it has ever been. Take 20–30 minutes to pause, pray, and reflect honestly.
          </p>
        </div>

        <Tabs defaultValue="snapshot" className="space-y-6">
          <TabsList className="font-body">
            <TabsTrigger value="snapshot" className="gap-2 font-body font-semibold">
              <Save className="h-4 w-4" /> Current Snapshot
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 font-body font-semibold">
              <History className="h-4 w-4" /> History
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-2 font-body font-semibold">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="space-y-8">
            {/* Header Fields */}
            <Card>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">My Purpose Statement</Label>
                  <Textarea
                    value={purposeStatement}
                    onChange={(e) => setPurposeStatement(e.target.value)}
                    placeholder="What is your life purpose?"
                    className="text-base font-body min-h-[90px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-heading font-semibold">My Goal for This Quarter</Label>
                  <Textarea
                    value={quarterlyGoal}
                    onChange={(e) => setQuarterlyGoal(e.target.value)}
                    placeholder="What are you focused on this quarter?"
                    className="text-base font-body min-h-[90px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Personal Life */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h2 className="text-2xl font-heading font-bold text-primary">Personal Life</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {personalCategories.map((cat) => (
                  <Card key={cat.id} className={`${getScoreBg(ratings[cat.id]?.score ?? 5)} transition-all hover:shadow-md`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-heading">{cat.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs font-body text-muted-foreground italic">{cat.scriptureRef}</p>
                          </div>
                        </div>
                        <span className={`text-4xl font-heading font-bold ${getScoreColor(ratings[cat.id]?.score ?? 5)}`}>
                          {ratings[cat.id]?.score ?? 5}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-body font-semibold text-muted-foreground">Your Rating</Label>
                        <Slider
                          value={[ratings[cat.id]?.score ?? 5]}
                          onValueChange={([v]) => updateRating(cat.id, 'score', v)}
                          min={1}
                          max={10}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs font-body text-muted-foreground">
                          <span>1</span><span>5 (avg)</span><span>10</span>
                        </div>
                      </div>
                      {cat.hasSpouseRating && (
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-body font-semibold text-muted-foreground">Spouse Rating</Label>
                            <span className={`text-xl font-heading font-bold ${getScoreColor(ratings[cat.id]?.spouseScore ?? 5)}`}>
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
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-body font-semibold text-muted-foreground">Child Rating</Label>
                            <span className={`text-xl font-heading font-bold ${getScoreColor(ratings[cat.id]?.childScore ?? 5)}`}>
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
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-1 bg-secondary rounded-full" />
                <h2 className="text-2xl font-heading font-bold text-primary">Business</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {businessCategories.map((cat) => (
                  <Card key={cat.id} className={`${getScoreBg(ratings[cat.id]?.score ?? 5)} transition-all hover:shadow-md`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-heading">{cat.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs font-body text-muted-foreground italic">{cat.scriptureRef}</p>
                          </div>
                        </div>
                        <span className={`text-4xl font-heading font-bold ${getScoreColor(ratings[cat.id]?.score ?? 5)}`}>
                          {ratings[cat.id]?.score ?? 5}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label className="text-sm font-body font-semibold text-muted-foreground">Your Rating</Label>
                        <Slider
                          value={[ratings[cat.id]?.score ?? 5]}
                          onValueChange={([v]) => updateRating(cat.id, 'score', v)}
                          min={1}
                          max={10}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs font-body text-muted-foreground">
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
                <CardTitle className="text-lg font-heading">Major Issue for Discussion / Major Prayer Request</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={majorIssue}
                  onChange={(e) => setMajorIssue(e.target.value)}
                  placeholder="What is the biggest issue you're facing right now? What do you need prayer for?"
                  className="text-base font-body min-h-[120px]"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" onClick={handleSave} className="text-base font-heading font-semibold px-8 h-12">
                <Save className="h-5 w-5 mr-2" />
                Save Snapshot
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Score Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(213 15% 82%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fontFamily: 'Quicksand' }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12, fontFamily: 'Quicksand' }} />
                      <Tooltip contentStyle={{ fontFamily: 'Quicksand', borderRadius: '8px' }} />
                      {SNAPSHOT_CATEGORIES.map((cat, i) => (
                        <Line
                          key={cat.id}
                          type="monotone"
                          dataKey={cat.id}
                          name={cat.name}
                          stroke={`hsl(${(i * 33) % 360} 60% 45%)`}
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
                <CardTitle className="font-heading text-xl">Current Snapshot Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(213 15% 82%)" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fontFamily: 'Quicksand' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'Quicksand' }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(39 78% 48%)"
                        fill="hsl(39 78% 48%)"
                        fillOpacity={0.25}
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
