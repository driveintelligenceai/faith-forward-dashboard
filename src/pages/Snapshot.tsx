import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SNAPSHOT_CONFIGS } from '@/data/snapshot-categories';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleSnapshotType, SNAPSHOT_TYPE_LABELS } from '@/types';
import type { SnapshotRating, SnapshotType, SnapshotCategory, UserRole } from '@/types';
import { Save, History, BarChart3, BookOpen, MessageCircle, X, Bookmark } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { SnapshotCompanion } from '@/components/snapshot/SnapshotCompanion';

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

function getScoreLabel(score: number) {
  if (score >= 9) return 'Exceptional';
  if (score >= 7) return 'Strong';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Needs Work';
  return 'Critical';
}

export default function Snapshot() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const defaultType = profile ? getRoleSnapshotType((profile.role || 'member') as UserRole) : 'member';
  const [snapshotType, setSnapshotType] = useState<SnapshotType>(defaultType);
  const categories = SNAPSHOT_CONFIGS[snapshotType];

  const [purposeStatement, setPurposeStatement] = useState(MOCK_SNAPSHOTS[0]?.purposeStatement ?? '');
  const [quarterlyGoal, setQuarterlyGoal] = useState(MOCK_SNAPSHOTS[0]?.quarterlyGoal ?? '');
  const [majorIssue, setMajorIssue] = useState(MOCK_SNAPSHOTS[0]?.majorIssue ?? '');
  const [activeCategory, setActiveCategory] = useState<SnapshotCategory | null>(null);
  const [showCompanion, setShowCompanion] = useState(true);
  const [annotations, setAnnotations] = useState<Record<string, string>>({});

  const [ratings, setRatings] = useState<Record<string, SnapshotRating>>(() => {
    const initial: Record<string, SnapshotRating> = {};
    Object.values(SNAPSHOT_CONFIGS).flat().forEach((cat) => {
      const existing = MOCK_SNAPSHOTS[0]?.ratings.find((r) => r.categoryId === cat.id);
      initial[cat.id] = existing ?? { categoryId: cat.id, score: 5, spouseScore: 5, childScore: 5 };
    });
    return initial;
  });

  const previousRatings = useMemo(() => {
    if (MOCK_SNAPSHOTS.length < 2) return undefined;
    const prev: Record<string, SnapshotRating> = {};
    MOCK_SNAPSHOTS[1].ratings.forEach((r) => { prev[r.categoryId] = r; });
    return prev;
  }, []);

  const updateRating = (catId: string, field: keyof SnapshotRating, value: number) => {
    setRatings((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: value } }));
  };

  const handleCategoryFocus = (cat: SnapshotCategory) => {
    setActiveCategory(cat);
    if (!showCompanion) setShowCompanion(true);
  };

  const handleSave = () => {
    toast({ title: 'Snapshot Saved', description: `Your ${SNAPSHOT_TYPE_LABELS[snapshotType]} has been saved successfully.` });
  };

  const personalCategories = categories.filter((c) => c.group === 'personal');
  const professionalCategories = categories.filter((c) => c.group === 'professional');
  const spiritualCategories = categories.filter((c) => c.group === 'spiritual');

  const historyData = MOCK_SNAPSHOTS.slice().reverse().map((s) => {
    const row: Record<string, string | number> = {
      date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    };
    s.ratings.forEach((r) => { row[r.categoryId] = r.score; });
    return row;
  });

  const radarData = categories.map((cat) => ({
    category: cat.name.length > 12 ? cat.name.slice(0, 12) + '…' : cat.name,
    score: ratings[cat.id]?.score ?? 5,
    fullMark: 10,
  }));

  const avgScore = categories.length > 0
    ? (categories.reduce((sum, c) => sum + (ratings[c.id]?.score ?? 5), 0) / categories.length).toFixed(1)
    : '5.0';

  const renderCategoryCard = (cat: SnapshotCategory) => {
    const rating = ratings[cat.id];
    const score = rating?.score ?? 5;
    const prevScore = previousRatings?.[cat.id]?.score;
    const trend = prevScore !== undefined ? score - prevScore : 0;

    return (
      <Card
        key={cat.id}
        className={`${getScoreBg(score)} transition-all hover:shadow-md cursor-pointer ${activeCategory?.id === cat.id ? 'ring-2 ring-secondary shadow-lg' : ''}`}
        onClick={() => handleCategoryFocus(cat)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-heading leading-tight">{cat.name}</CardTitle>
              <div className="flex items-center gap-1.5 mt-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-body text-muted-foreground italic">{cat.scriptureRef}</p>
              </div>
              {cat.description && (
                <p className="text-sm font-body text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>
              )}
            </div>
            <div className="text-right ml-4 shrink-0">
              <span className={`text-4xl font-heading font-bold ${getScoreColor(score)}`}>{score}</span>
              <p className={`text-sm font-body font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
              {trend !== 0 && (
                <p className={`text-sm font-body font-bold ${trend > 0 ? 'text-score-high' : 'text-score-low'}`}>
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} from last
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-body font-semibold text-muted-foreground">Your Rating</Label>
              <span className="text-sm font-body text-muted-foreground">1 – 10 scale</span>
            </div>
            <Slider
              value={[score]}
              onValueChange={([v]) => updateRating(cat.id, 'score', v)}
              min={1} max={10} step={1}
              className="py-2"
            />
            <div className="flex justify-between text-xs font-body text-muted-foreground">
              <span>1 poor</span><span>5 average</span><span>10 best ever</span>
            </div>
          </div>

          {cat.hasSpouseRating && (
            <div className="space-y-3 pt-3 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-body font-semibold text-muted-foreground">Spouse's Rating</Label>
                <span className={`text-2xl font-heading font-bold ${getScoreColor(rating?.spouseScore ?? 5)}`}>
                  {rating?.spouseScore ?? 5}
                </span>
              </div>
              <Slider
                value={[rating?.spouseScore ?? 5]}
                onValueChange={([v]) => updateRating(cat.id, 'spouseScore', v)}
                min={1} max={10} step={1} className="py-2"
              />
            </div>
          )}

          {cat.hasChildRating && (
            <div className="space-y-3 pt-3 border-t border-dashed">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-body font-semibold text-muted-foreground">Child's Rating</Label>
                <span className={`text-2xl font-heading font-bold ${getScoreColor(rating?.childScore ?? 5)}`}>
                  {rating?.childScore ?? 5}
                </span>
              </div>
              <Slider
                value={[rating?.childScore ?? 5]}
                onValueChange={([v]) => updateRating(cat.id, 'childScore', v)}
                min={1} max={10} step={1} className="py-2"
              />
            </div>
          )}

          {/* Annotation */}
          {annotations[cat.id] ? (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-1.5 mb-1">
                <Bookmark className="h-4 w-4 text-secondary" />
                <span className="text-sm font-body font-semibold text-secondary">Life Note</span>
              </div>
              <p className="text-sm font-body text-muted-foreground italic">{annotations[cat.id]}</p>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const note = prompt('Add a life event or note for this category:');
                if (note) setAnnotations((prev) => ({ ...prev, [cat.id]: note }));
              }}
              className="text-sm font-body text-muted-foreground hover:text-secondary transition-colors flex items-center gap-1.5 pt-2 min-h-[40px]"
            >
              <Bookmark className="h-4 w-4" />
              Add a life note
            </button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCategoryGroup = (title: string, cats: SnapshotCategory[], colorClass: string) => {
    if (cats.length === 0) return null;
    const groupAvg = (cats.reduce((s, c) => s + (ratings[c.id]?.score ?? 5), 0) / cats.length).toFixed(1);
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className={`h-8 w-1.5 rounded-full ${colorClass}`} />
          <h2 className="text-2xl font-heading font-bold text-primary">{title}</h2>
          <span className="text-base font-body text-muted-foreground ml-auto">
            Group Average: <span className="font-semibold">{groupAvg}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cats.map(renderCategoryCard)}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
              {SNAPSHOT_TYPE_LABELS[snapshotType]}
            </h1>
            <p className="text-lg font-body text-muted-foreground mt-2 max-w-xl">
              Rate your last 30 days honestly. Take 20–30 minutes to pause, pray, and reflect.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={snapshotType} onValueChange={(v) => setSnapshotType(v as SnapshotType)}>
              <SelectTrigger className="w-[220px] font-body text-base h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member" className="text-base py-3">Member Snapshot™</SelectItem>
                <SelectItem value="leader" className="text-base py-3">Leader Snapshot™</SelectItem>
                <SelectItem value="advisor" className="text-base py-3">Advisor Snapshot™</SelectItem>
                <SelectItem value="nonprofit" className="text-base py-3">Nonprofit Snapshot™</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showCompanion ? 'default' : 'outline'}
              size="lg"
              className="gap-2 font-body text-base h-12"
              onClick={() => setShowCompanion(!showCompanion)}
            >
              <MessageCircle className="h-5 w-5" />
              {showCompanion ? 'Hide' : 'Show'} AI Companion
            </Button>
          </div>
        </div>

        {/* Score Summary Bar */}
        <Card className="border-secondary/20 bg-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-6 overflow-x-auto">
              <div className="text-center shrink-0">
                <p className="text-4xl font-heading font-bold text-secondary">{avgScore}</p>
                <p className="text-sm font-body text-muted-foreground">Overall</p>
              </div>
              <div className="h-12 w-px bg-border shrink-0" />
              <div className="flex gap-5 overflow-x-auto pb-1">
                {categories.map((cat) => {
                  const s = ratings[cat.id]?.score ?? 5;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryFocus(cat)}
                      className={`text-center transition-all hover:scale-105 shrink-0 min-w-[60px] ${activeCategory?.id === cat.id ? 'scale-105' : ''}`}
                      title={cat.name}
                    >
                      <p className={`text-2xl font-heading font-bold ${getScoreColor(s)}`}>{s}</p>
                      <p className="text-xs font-body text-muted-foreground max-w-[70px] truncate">{cat.name}</p>
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto shrink-0">
                <Button size="lg" onClick={handleSave} className="font-heading font-semibold h-12 px-6 gap-2 text-base">
                  <Save className="h-5 w-5" />
                  Save Snapshot
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="snapshot" className="space-y-6">
          <TabsList className="p-2 gap-2 font-body">
            <TabsTrigger value="snapshot" className="gap-2 font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              <Save className="h-5 w-5" /> My Snapshot
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              <History className="h-5 w-5" /> History
            </TabsTrigger>
            <TabsTrigger value="radar" className="gap-2 font-body font-semibold text-base px-5 py-2.5 min-h-[44px]">
              <BarChart3 className="h-5 w-5" /> Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot">
            <div className={`grid gap-8 ${showCompanion ? 'lg:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
              {/* Left: Scorecard */}
              <div className="space-y-10">
                {/* Purpose & Goal */}
                <Card>
                  <CardContent className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-heading font-semibold">My Purpose Statement</Label>
                      <Textarea
                        value={purposeStatement}
                        onChange={(e) => setPurposeStatement(e.target.value)}
                        placeholder="Why has God put you on this earth? What is your life's mission?"
                        className="text-base font-body min-h-[100px] resize-none"
                        onFocus={() => setActiveCategory(null)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-heading font-semibold">My Goal for This Quarter</Label>
                      <Textarea
                        value={quarterlyGoal}
                        onChange={(e) => setQuarterlyGoal(e.target.value)}
                        placeholder="One primary goal you are focused on achieving this quarter."
                        className="text-base font-body min-h-[100px] resize-none"
                        onFocus={() => setActiveCategory(null)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {renderCategoryGroup('Spiritual Life', spiritualCategories, 'bg-secondary')}
                {renderCategoryGroup('Personal Life', personalCategories, 'bg-primary')}
                {renderCategoryGroup('Professional Life', professionalCategories, 'bg-primary/60')}

                {/* Major Issue / Prayer */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-heading">Major Issue for Discussion / Major Prayer Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={majorIssue}
                      onChange={(e) => setMajorIssue(e.target.value)}
                      placeholder="What is the biggest issue on your heart? What do you need prayer for? Be specific — your brothers are here for you."
                      className="text-base font-body min-h-[120px] resize-none"
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end pb-10">
                  <Button size="lg" onClick={handleSave} className="font-heading font-semibold px-10 h-14 gap-2 text-lg">
                    <Save className="h-6 w-6" />
                    Save Snapshot
                  </Button>
                </div>
              </div>

              {/* Right: AI Companion */}
              {showCompanion && (
                <div className="hidden lg:block">
                  <div className="sticky top-4 h-[calc(100vh-12rem)]">
                    <SnapshotCompanion
                      currentCategory={activeCategory}
                      ratings={ratings}
                      previousRatings={previousRatings}
                    userName={profile?.full_name ?? 'Brother'}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile companion FAB */}
            {showCompanion && (
              <div className="lg:hidden fixed bottom-5 right-5 z-50">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 shadow-xl text-lg"
                  onClick={() => {
                    const el = document.getElementById('mobile-companion');
                    if (el) el.classList.toggle('hidden');
                  }}
                >
                  <MessageCircle className="h-7 w-7" />
                </Button>
                <div
                  id="mobile-companion"
                  className="hidden absolute bottom-20 right-0 w-[340px] h-[500px] shadow-2xl rounded-xl overflow-hidden"
                >
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      onClick={() => document.getElementById('mobile-companion')?.classList.add('hidden')}
                      className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <SnapshotCompanion
                    currentCategory={activeCategory}
                    ratings={ratings}
                    previousRatings={previousRatings}
                    userName={profile?.full_name ?? 'Brother'}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Score Trends Over Time</CardTitle>
                <p className="text-base font-body text-muted-foreground mt-1">Track your growth. Look for patterns and celebrate progress.</p>
              </CardHeader>
              <CardContent>
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(213 15% 82%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 14, fontFamily: 'Quicksand' }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 14, fontFamily: 'Quicksand' }} />
                      <Tooltip contentStyle={{ fontFamily: 'Quicksand', borderRadius: '8px', fontSize: 14 }} />
                      {categories.map((cat, i) => (
                        <Line
                          key={cat.id}
                          type="monotone"
                          dataKey={cat.id}
                          name={cat.name}
                          stroke={`hsl(${(i * 33) % 360} 60% 45%)`}
                          strokeWidth={2.5}
                          dot={{ r: 5 }}
                          connectNulls
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
                <CardTitle className="font-heading text-2xl">Current Snapshot Overview</CardTitle>
                <p className="text-base font-body text-muted-foreground mt-1">A bird's-eye view of where you stand across all categories.</p>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(213 15% 82%)" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 13, fontFamily: 'Quicksand' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 12, fontFamily: 'Quicksand' }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="hsl(39 78% 48%)"
                        fill="hsl(39 78% 48%)"
                        fillOpacity={0.25}
                        strokeWidth={2.5}
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
