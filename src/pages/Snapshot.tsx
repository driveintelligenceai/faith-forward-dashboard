import { useState, useMemo, useRef } from 'react';
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
import { useSnapshots } from '@/hooks/use-snapshots';
import { getRoleSnapshotType, SNAPSHOT_TYPE_LABELS } from '@/types';
import type { SnapshotRating, SnapshotType, SnapshotCategory, UserRole } from '@/types';
import { Save, History, MessageCircle, Bookmark, Loader2, Activity, Eye, Pencil } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { SnapshotCompanion } from '@/components/snapshot/SnapshotCompanion';
import { MobileCompanionSheet } from '@/components/snapshot/MobileCompanionSheet';
import { AIInsights } from '@/components/snapshot/AIInsights';
import { CategoryTimeline } from '@/components/snapshot/CategoryTimeline';
import { useIsMobile } from '@/hooks/use-mobile';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-primary';
  if (score >= 4) return 'text-muted-foreground';
  return 'text-destructive';
}

function getScoreBg(score: number) {
  if (score >= 7) return 'border-l-4 border-l-primary';
  if (score >= 4) return 'border-l-4 border-l-muted';
  return 'border-l-4 border-l-destructive/40';
}

export default function Snapshot() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { snapshots: dbSnapshots, isLoading, isSaving, saveSnapshot } = useSnapshots();
  const defaultType = profile ? getRoleSnapshotType((profile.role || 'member') as UserRole) : 'member';
  const [snapshotType, setSnapshotType] = useState<SnapshotType>(defaultType);
  const categories = SNAPSHOT_CONFIGS[snapshotType];
  const isMobile = useIsMobile();

  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSaved = allSnapshots[0];

  // Determine if user has saved this month's snapshot
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasCurrentMonth = latestSaved && latestSaved.date.startsWith(currentMonth);

  // Mode: 'score' = fresh scoring (no history visible), 'review' = post-save review
  const [mode, setMode] = useState<'score' | 'review'>(hasCurrentMonth ? 'review' : 'score');

  const [purposeStatement, setPurposeStatement] = useState(latestSaved?.purposeStatement ?? '');
  const [quarterlyGoal, setQuarterlyGoal] = useState(latestSaved?.quarterlyGoal ?? '');
  const [majorIssue, setMajorIssue] = useState(latestSaved?.majorIssue ?? '');
  const [activeCategory, setActiveCategory] = useState<SnapshotCategory | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [ratings, setRatings] = useState<Record<string, SnapshotRating>>(() => {
    const initial: Record<string, SnapshotRating> = {};
    Object.values(SNAPSHOT_CONFIGS).flat().forEach((cat) => {
      // In score mode, start fresh at 5 (don't load previous scores to avoid bias)
      if (!hasCurrentMonth) {
        initial[cat.id] = { categoryId: cat.id, score: 5, spouseScore: 5, childScore: 5 };
      } else {
        const existing = latestSaved?.ratings.find((r) => r.categoryId === cat.id);
        initial[cat.id] = existing ?? { categoryId: cat.id, score: 5, spouseScore: 5, childScore: 5 };
      }
    });
    return initial;
  });

  const previousRatings = useMemo(() => {
    if (allSnapshots.length < 2) return undefined;
    const prev: Record<string, SnapshotRating> = {};
    allSnapshots[1].ratings.forEach((r) => { prev[r.categoryId] = r; });
    return prev;
  }, [allSnapshots]);

  const updateRating = (catId: string, field: keyof SnapshotRating, value: number) => {
    setRatings((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: value } }));
  };

  const handleCategoryFocus = (cat: SnapshotCategory) => {
    setActiveCategory(cat);
    if (isMobile) setMobileSheetOpen(true);
  };

  const scrollToCategory = (catId: string) => {
    const el = categoryRefs.current.get(catId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const cat = categories.find(c => c.id === catId);
      if (cat) setActiveCategory(cat);
    }
  };

  const handleSave = async () => {
    const enrichedRatings = { ...ratings };
    Object.entries(annotations).forEach(([catId, note]) => {
      if (enrichedRatings[catId]) {
        enrichedRatings[catId] = { ...enrichedRatings[catId], lifeEvent: note };
      }
    });
    const result = await saveSnapshot(snapshotType, purposeStatement, quarterlyGoal, majorIssue, enrichedRatings);
    if (result) {
      setMode('review');
    }
  };

  const personalCategories = categories.filter(c => c.group === 'personal');
  const professionalCategories = categories.filter(c => c.group === 'professional');
  const spiritualCategories = categories.filter(c => c.group === 'spiritual');

  const avgScore = categories.length > 0
    ? (categories.reduce((sum, c) => sum + (ratings[c.id]?.score ?? 5), 0) / categories.length).toFixed(1)
    : '5.0';

  const radarData = categories.map(cat => ({
    category: cat.name.length > 10 ? cat.name.slice(0, 10) + '…' : cat.name,
    fullCategory: cat.name,
    catId: cat.id,
    score: ratings[cat.id]?.score ?? 5,
    fullMark: 10,
  }));

  const renderCategoryCard = (cat: SnapshotCategory) => {
    const rating = ratings[cat.id];
    const score = rating?.score ?? 5;

    return (
      <div key={cat.id} ref={(el) => { if (el) categoryRefs.current.set(cat.id, el); }}>
        <Card
          className={`${getScoreBg(score)} transition-all cursor-pointer ${activeCategory?.id === cat.id ? 'ring-2 ring-secondary shadow-md' : 'hover:shadow-sm'}`}
          onClick={() => handleCategoryFocus(cat)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-heading font-bold leading-tight">{cat.name}</h3>
              <span className={`text-3xl font-heading font-bold ${getScoreColor(score)}`}>{score}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-body text-muted-foreground">Your Rating</Label>
                <span className="text-xs font-body text-muted-foreground">{score}/10</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={([v]) => updateRating(cat.id, 'score', v)}
                min={1} max={10} step={1} className="py-1"
              />
            </div>

            {cat.hasSpouseRating && (
              <div className="space-y-1.5 pt-2 mt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-body text-muted-foreground">Spouse</Label>
                  <span className="text-xs font-body text-muted-foreground">{rating?.spouseScore ?? 5}/10</span>
                </div>
                <Slider
                  value={[rating?.spouseScore ?? 5]}
                  onValueChange={([v]) => updateRating(cat.id, 'spouseScore', v)}
                  min={1} max={10} step={1} className="py-1"
                />
              </div>
            )}

            {cat.hasChildRating && (
              <div className="space-y-1.5 pt-2 mt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-body text-muted-foreground">Child</Label>
                  <span className="text-xs font-body text-muted-foreground">{rating?.childScore ?? 5}/10</span>
                </div>
                <Slider
                  value={[rating?.childScore ?? 5]}
                  onValueChange={([v]) => updateRating(cat.id, 'childScore', v)}
                  min={1} max={10} step={1} className="py-1"
                />
              </div>
            )}

            {/* Life note */}
            {annotations[cat.id] ? (
              <div className="pt-2 mt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs font-body font-semibold text-secondary">Life Note</span>
                </div>
                <p className="text-xs font-body text-muted-foreground mt-0.5">{annotations[cat.id]}</p>
              </div>
            ) : editingNote === cat.id ? (
              <div className="pt-2 mt-2 border-t border-border/30 space-y-2">
                <Textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="What happened this month?"
                  className="text-sm min-h-[60px] resize-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => { e.stopPropagation(); setEditingNote(null); setNoteInput(''); }}>Cancel</Button>
                  <Button size="sm" className="text-xs h-8" onClick={(e) => {
                    e.stopPropagation();
                    if (noteInput.trim()) setAnnotations(prev => ({ ...prev, [cat.id]: noteInput.trim() }));
                    setEditingNote(null); setNoteInput('');
                  }}>Save</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setEditingNote(cat.id); setNoteInput(''); }}
                className="text-xs font-body text-muted-foreground hover:text-secondary transition-colors flex items-center gap-1 pt-2 mt-2 border-t border-border/30 min-h-[36px]"
              >
                <Bookmark className="h-3.5 w-3.5" /> Add a life note
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCategoryGroup = (title: string, cats: SnapshotCategory[], colorClass: string) => {
    if (cats.length === 0) return null;
    const groupAvg = (cats.reduce((s, c) => s + (ratings[c.id]?.score ?? 5), 0) / cats.length).toFixed(1);
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-7 w-1.5 rounded-full ${colorClass}`} />
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">{title}</h2>
          <span className="text-sm font-body text-muted-foreground ml-auto hidden sm:block">
            Avg: <span className="font-semibold">{groupAvg}</span>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {cats.map(renderCategoryCard)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="font-body text-muted-foreground">Loading your Snapshot history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
              {SNAPSHOT_TYPE_LABELS[snapshotType]}
            </h1>
            <p className="text-sm sm:text-base font-body text-muted-foreground mt-1">
              {mode === 'score'
                ? 'Rate your last 30 days honestly. No peeking at last month.'
                : 'Your results are in. Review your trends and insights.'}
              {allSnapshots.length > 0 && (
                <span className="text-secondary font-semibold"> · {allSnapshots.length} on record</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode toggle */}
            {hasCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode(mode === 'score' ? 'review' : 'score')}
                className="font-body text-sm gap-1.5"
              >
                {mode === 'score' ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {mode === 'score' ? 'View Results' : 'Edit Scores'}
              </Button>
            )}
            <Select value={snapshotType} onValueChange={(v) => setSnapshotType(v as SnapshotType)}>
              <SelectTrigger className="w-[180px] sm:w-[220px] font-body text-sm sm:text-base h-10 sm:h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member" className="text-sm py-2.5">Member Snapshot™</SelectItem>
                <SelectItem value="leader" className="text-sm py-2.5">Leader Snapshot™</SelectItem>
                <SelectItem value="advisor" className="text-sm py-2.5">Advisor Snapshot™</SelectItem>
                <SelectItem value="nonprofit" className="text-sm py-2.5">Nonprofit Snapshot™</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* SCORE MODE — Clean slate, no history, just rate        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'score' && (
          <>
            {/* Score bar — only shows overall avg + save button */}
            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <p className="text-3xl sm:text-4xl font-heading font-bold text-secondary">{avgScore}</p>
                    <p className="text-xs sm:text-sm font-body text-muted-foreground">Overall</p>
                  </div>
                  <Button
                    size={isMobile ? 'default' : 'lg'}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="font-heading font-semibold h-10 sm:h-12 px-4 sm:px-6 gap-2 text-sm sm:text-base shrink-0"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Saving...' : 'Save Snapshot'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className={`grid gap-6 sm:gap-8 ${!isMobile ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
              {/* Left: Scoring cards */}
              <div className="space-y-6 sm:space-y-8">
                {/* Purpose & Goal */}
                <Card>
                  <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-heading font-semibold">My Purpose</Label>
                      <Textarea
                        value={purposeStatement}
                        onChange={(e) => setPurposeStatement(e.target.value)}
                        placeholder="Why has God put you on this earth?"
                        className="text-sm sm:text-base font-body min-h-[80px] resize-none"
                        onFocus={() => setActiveCategory(null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base font-heading font-semibold">Quarterly Goal</Label>
                      <Textarea
                        value={quarterlyGoal}
                        onChange={(e) => setQuarterlyGoal(e.target.value)}
                        placeholder="One primary goal for this quarter."
                        className="text-sm sm:text-base font-body min-h-[80px] resize-none"
                        onFocus={() => setActiveCategory(null)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {renderCategoryGroup('Spiritual Life', spiritualCategories, 'bg-secondary')}
                {renderCategoryGroup('Personal Life', personalCategories, 'bg-primary')}
                {renderCategoryGroup('Professional Life', professionalCategories, 'bg-primary/60')}

                {/* Prayer Request */}
                <Card>
                  <CardHeader className="pb-2 px-4 sm:px-6">
                    <CardTitle className="text-lg sm:text-xl font-heading">Prayer Request</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <Textarea
                      value={majorIssue}
                      onChange={(e) => setMajorIssue(e.target.value)}
                      placeholder="What is the biggest issue on your heart?"
                      className="text-sm sm:text-base font-body min-h-[80px] sm:min-h-[100px] resize-none"
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end pb-6 sm:pb-10">
                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="font-heading font-semibold px-6 sm:px-10 h-12 sm:h-14 gap-2 text-base sm:text-lg"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {isSaving ? 'Saving...' : 'Save Snapshot'}
                  </Button>
                </div>
              </div>

              {/* Right: AI Companion — desktop */}
              {!isMobile && (
                <div className="hidden lg:block">
                  <div className="sticky top-20 h-[calc(100vh-12rem)]">
                    <SnapshotCompanion
                      currentCategory={activeCategory}
                      ratings={ratings}
                      previousRatings={previousRatings}
                      userName={profile?.full_name ?? 'Brother'}
                      allSnapshots={allSnapshots}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: AI Companion */}
            {isMobile && (
              <>
                <MobileCompanionSheet
                  open={mobileSheetOpen}
                  onOpenChange={setMobileSheetOpen}
                  currentCategory={activeCategory}
                  ratings={ratings}
                  previousRatings={previousRatings}
                  userName={profile?.full_name ?? 'Brother'}
                  allSnapshots={allSnapshots}
                />
                <div className="fixed bottom-5 right-5 z-40">
                  <Button size="lg" className="rounded-full h-14 w-14 shadow-xl" onClick={() => setMobileSheetOpen(true)}>
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEW MODE — Post-save: history, insights, radar      */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'review' && (
          <Tabs defaultValue="results" className="space-y-4 sm:space-y-6">
            <TabsList className="p-1.5 sm:p-2 gap-1 sm:gap-2 font-body w-full flex">
              <TabsTrigger value="results" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px]">
                <Eye className="h-4 w-4" /> Results
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px]">
                <Activity className="h-4 w-4" /> Insights
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px]">
                <History className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

            {/* RESULTS TAB */}
            <TabsContent value="results">
              <div className="space-y-6">
                {/* Overall Score + Radar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card className="border-secondary/20 bg-secondary/5">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <p className="text-6xl sm:text-7xl font-heading font-bold text-secondary">{avgScore}</p>
                      <p className="text-sm font-body text-muted-foreground mt-2">Overall Score · {categories.length} categories</p>
                      {previousRatings && (
                        <p className="text-xs font-body text-muted-foreground mt-1">
                          {(() => {
                            const prevAvg = categories.reduce((s, c) => s + (previousRatings[c.id]?.score ?? 5), 0) / categories.length;
                            const delta = parseFloat(avgScore) - prevAvg;
                            return delta > 0 ? `↑ Up ${delta.toFixed(1)} from last month` : delta < 0 ? `↓ Down ${Math.abs(delta).toFixed(1)} from last month` : 'Same as last month';
                          })()}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="h-[250px] sm:h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={isMobile ? '65%' : '70%'}>
                            <PolarGrid stroke="hsl(213 15% 82%)" />
                            <PolarAngleAxis dataKey="category" tick={{ fontSize: isMobile ? 10 : 12, fontFamily: 'Quicksand' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'Quicksand' }} />
                            <Radar name="Score" dataKey="score" stroke="hsl(39 78% 48%)" fill="hsl(39 78% 48%)" fillOpacity={0.25} strokeWidth={2.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Per-category scores with comparison */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-heading">Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map(cat => {
                        const score = ratings[cat.id]?.score ?? 5;
                        const prevScore = previousRatings?.[cat.id]?.score;
                        const delta = prevScore !== undefined ? score - prevScore : null;
                        return (
                          <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg ${getScoreBg(score)}`}>
                            <span className="text-sm font-heading font-bold truncate mr-2">{cat.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {delta !== null && delta !== 0 && (
                                <span className={`text-xs font-body font-bold ${delta > 0 ? 'text-primary' : 'text-destructive'}`}>
                                  {delta > 0 ? '+' : ''}{delta}
                                </span>
                              )}
                              <span className={`text-xl font-heading font-bold ${getScoreColor(score)}`}>{score}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* INSIGHTS TAB */}
            <TabsContent value="insights">
              <AIInsights
                snapshots={allSnapshots}
                categories={categories}
                userName={profile?.full_name ?? 'Brother'}
              />
            </TabsContent>

            {/* HISTORY TAB — Category Timeline Cards */}
            <TabsContent value="history">
              <div className="space-y-6">
                {/* Overall trend summary */}
                <Card className="border-secondary/20">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-heading font-bold">12-Month Journey</p>
                        <p className="text-sm font-body text-muted-foreground mt-0.5">
                          Tap any month to see what happened. Look for your <span className="text-secondary font-semibold">life notes</span> — they tell the real story.
                        </p>
                      </div>
                      <p className="text-sm font-body text-muted-foreground shrink-0">
                        {allSnapshots.length} snapshots
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Grouped by category type */}
                {[
                  { title: 'Spiritual Life', cats: spiritualCategories, color: 'bg-secondary' },
                  { title: 'Personal Life', cats: personalCategories, color: 'bg-primary' },
                  { title: 'Professional Life', cats: professionalCategories, color: 'bg-primary/60' },
                ].map(({ title, cats, color }) => cats.length > 0 && (
                  <div key={title}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-6 w-1.5 rounded-full ${color}`} />
                      <h2 className="text-lg font-heading font-bold text-primary">{title}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cats.map(cat => (
                        <CategoryTimeline key={cat.id} category={cat} snapshots={allSnapshots} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
