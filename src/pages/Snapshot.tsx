import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SNAPSHOT_CONFIGS, SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useSnapshots } from '@/hooks/use-snapshots';
import { useReminders } from '@/hooks/use-reminders';
import { getRoleSnapshotType, SNAPSHOT_TYPE_LABELS } from '@/types';
import type { SnapshotRating, SnapshotType, SnapshotCategory, UserRole } from '@/types';
import { Save, History, Loader2, Activity, Eye, Pencil, ArrowLeft, ArrowRight, ChevronRight, Share2, Bell, BookOpen, MessageSquare } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AIInsights } from '@/components/snapshot/AIInsights';
import { CategoryTimeline } from '@/components/snapshot/CategoryTimeline';
import { SetReminderSheet } from '@/components/dashboard/SetReminderSheet';
import { streamChat } from '@/lib/ai-stream';
import ReactMarkdown from 'react-markdown';

function getScoreColor(score: number) {
  if (score >= 7) return 'text-primary';
  if (score >= 4) return 'text-secondary';
  return 'text-destructive';
}

function getScoreBg(score: number) {
  if (score >= 7) return 'bg-primary/10';
  if (score >= 4) return 'bg-secondary/10';
  return 'bg-destructive/10';
}

function getScoreBorder(score: number) {
  if (score >= 7) return 'border-l-4 border-l-primary';
  if (score >= 4) return 'border-l-4 border-l-muted';
  return 'border-l-4 border-l-destructive/40';
}

export default function Snapshot() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { snapshots: dbSnapshots, isLoading, isSaving, saveSnapshot } = useSnapshots();
  const { addReminder } = useReminders();
  const defaultType = profile ? getRoleSnapshotType((profile.role || 'member') as UserRole) : 'member';
  const [snapshotType, setSnapshotType] = useState<SnapshotType>(defaultType);
  const categories = SNAPSHOT_CONFIGS[snapshotType];

  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSaved = allSnapshots[0];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasCurrentMonth = latestSaved && latestSaved.date.startsWith(currentMonth);

  // Mode: 'score' or 'review'
  const [mode, setMode] = useState<'score' | 'review'>(hasCurrentMonth ? 'review' : 'score');

  // Step-by-step: 0 = foundation, 1..N = categories, N+1 = summary
  const [step, setStep] = useState(0);
  const totalSteps = categories.length + 2; // foundation + categories + summary

  const [purposeStatement, setPurposeStatement] = useState(latestSaved?.purposeStatement ?? '');
  const [quarterlyGoal, setQuarterlyGoal] = useState(latestSaved?.quarterlyGoal ?? '');
  const [majorIssue, setMajorIssue] = useState(latestSaved?.majorIssue ?? '');
  const [aiSuggestions, setAiSuggestions] = useState<{text: string; categoryId: string}[]>([]);
  const [reminderSheet, setReminderSheet] = useState(false);
  const [reminderDefaults, setReminderDefaults] = useState({ text: '', categoryId: '' });

  const [ratings, setRatings] = useState<Record<string, SnapshotRating>>(() => {
    const initial: Record<string, SnapshotRating> = {};
    Object.values(SNAPSHOT_CONFIGS).flat().forEach((cat) => {
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

  const handleSave = async () => {
    const result = await saveSnapshot(snapshotType, purposeStatement, quarterlyGoal, majorIssue, ratings);
    if (result) {
      setMode('review');
      // Generate AI-suggested reminders for declining categories
      const suggestions: {text: string; categoryId: string}[] = [];
      if (previousRatings) {
        categories.forEach(cat => {
          const score = ratings[cat.id]?.score ?? 5;
          const prev = previousRatings[cat.id]?.score;
          if (prev && score < prev && score <= 5) {
            suggestions.push({
              text: `Take action on ${cat.name} — dropped from ${prev} to ${score}`,
              categoryId: cat.id,
            });
          }
        });
      }
      if (suggestions.length > 0) {
        setAiSuggestions(suggestions.slice(0, 2));
      }
    }
  };

  const acceptSuggestion = (s: {text: string; categoryId: string}) => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    addReminder({ text: s.text, categoryId: s.categoryId, dueDate: d.toISOString().split('T')[0], source: 'ai' });
    setAiSuggestions(prev => prev.filter(x => x.text !== s.text));
    toast({ title: 'Reminder added', description: 'Added to your action items.' });
  };

  const avgScore = categories.length > 0
    ? (categories.reduce((sum, c) => sum + (ratings[c.id]?.score ?? 5), 0) / categories.length).toFixed(1)
    : '5.0';

  const radarData = categories.map(cat => ({
    category: cat.name.length > 10 ? cat.name.slice(0, 10) + '…' : cat.name,
    score: ratings[cat.id]?.score ?? 5,
    fullMark: 10,
  }));

  const personalCategories = categories.filter(c => c.group === 'personal');
  const professionalCategories = categories.filter(c => c.group === 'professional');
  const spiritualCategories = categories.filter(c => c.group === 'spiritual');

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
                ? 'Rate your last 30 days honestly. One area at a time.'
                : 'Your results are in. Review your trends and insights.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setMode(mode === 'score' ? 'review' : 'score'); setStep(0); }}
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
        {/* SCORE MODE — Step-by-step card flow                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'score' && (
          <div className="max-w-2xl mx-auto">
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm font-body text-muted-foreground shrink-0">
                {step === 0 ? 'Prepare' : step <= categories.length ? `${step} of ${categories.length}` : 'Summary'}
              </span>
            </div>

            {/* Step 0: Foundation */}
            {step === 0 && (
              <Card className="border-secondary/20">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2 pb-2">
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">
                      Take a moment to center yourself
                    </h2>
                    <p className="text-base font-body text-muted-foreground">
                      What's on your heart this month?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">My Purpose</Label>
                    <Textarea
                      value={purposeStatement}
                      onChange={(e) => setPurposeStatement(e.target.value)}
                      placeholder="Why has God put you on this earth?"
                      className="text-base font-body min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Quarterly Goal</Label>
                    <Textarea
                      value={quarterlyGoal}
                      onChange={(e) => setQuarterlyGoal(e.target.value)}
                      placeholder="One primary goal for this quarter."
                      className="text-base font-body min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-heading font-semibold">Prayer Request</Label>
                    <Textarea
                      value={majorIssue}
                      onChange={(e) => setMajorIssue(e.target.value)}
                      placeholder="What is the biggest issue on your heart?"
                      className="text-base font-body min-h-[80px] resize-none"
                    />
                  </div>

                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                    onClick={() => setStep(1)}
                  >
                    Begin Your Snapshot
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Steps 1..N: Category Cards */}
            {step >= 1 && step <= categories.length && (
              <CategoryScoringCard
                category={categories[step - 1]}
                rating={ratings[categories[step - 1].id]}
                previousRating={previousRatings?.[categories[step - 1].id]}
                onUpdateRating={(field, value) => updateRating(categories[step - 1].id, field, value)}
                userName={profile?.full_name ?? 'Brother'}
                allSnapshots={allSnapshots}
                ratings={ratings}
                previousRatings={previousRatings}
              />
            )}

            {/* Final Step: Summary */}
            {step === totalSteps - 1 && (
              <Card className="border-secondary/20">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">Your Snapshot Summary</h2>
                    <p className="text-5xl font-heading font-bold text-secondary">{avgScore}</p>
                    <p className="text-sm font-body text-muted-foreground">Overall Average · {categories.length} categories</p>
                  </div>

                  <div className="space-y-2">
                    {categories.map(cat => {
                      const score = ratings[cat.id]?.score ?? 5;
                      const prevScore = previousRatings?.[cat.id]?.score;
                      const delta = prevScore !== undefined ? score - prevScore : null;
                      return (
                        <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg ${getScoreBorder(score)}`}>
                          <span className="text-sm font-heading font-bold truncate mr-2">{cat.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
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

                  <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  >
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    {isSaving ? 'Saving...' : 'Save My Snapshot'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation buttons */}
            {step > 0 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setStep(s => s - 1)}
                  className="font-body text-base gap-2 min-h-[48px]"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </Button>

                {step < totalSteps - 1 && (
                  <Button
                    size="lg"
                    onClick={() => setStep(s => s + 1)}
                    className="font-heading font-bold text-base gap-2 min-h-[48px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* REVIEW MODE                                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'review' && (
          <>
            {/* AI Suggestion cards after save */}
            {aiSuggestions.length > 0 && (
              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-secondary" />
                    <p className="font-heading font-bold text-sm text-foreground">James noticed some trends</p>
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-t border-border/30">
                      <p className="font-body text-sm text-foreground">{s.text}</p>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="text-xs font-body min-h-[36px]" onClick={() => setAiSuggestions(prev => prev.filter(x => x.text !== s.text))}>
                          Not now
                        </Button>
                        <Button size="sm" className="text-xs font-body min-h-[36px] bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => acceptSuggestion(s)}>
                          Add reminder
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="results" className="space-y-4 sm:space-y-6">
              <TabsList className="p-1.5 sm:p-2 gap-1 sm:gap-2 font-body w-full flex">
                <TabsTrigger value="results" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <Eye className="h-4 w-4" /> Results
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <Activity className="h-4 w-4" /> Insights
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <History className="h-4 w-4" /> History
                </TabsTrigger>
              </TabsList>

              {/* RESULTS TAB */}
              <TabsContent value="results">
                <div className="space-y-6">
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 font-body text-sm gap-1.5"
                          onClick={() => toast({ title: 'Coming Soon', description: 'Sharing with your Snapshot Group is on the way.' })}
                        >
                          <Share2 className="h-4 w-4" /> Share with my Group
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="h-[250px] sm:h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                              <PolarGrid stroke="hsl(213 15% 82%)" />
                              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fontFamily: 'Quicksand' }} />
                              <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'Quicksand' }} />
                              <Radar name="Score" dataKey="score" stroke="hsl(39 78% 48%)" fill="hsl(39 78% 48%)" fillOpacity={0.25} strokeWidth={2.5} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

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
                            <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg ${getScoreBorder(score)}`}>
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

              {/* HISTORY TAB */}
              <TabsContent value="history">
                <div className="space-y-6">
                  <Card className="border-secondary/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-heading font-bold">12-Month Journey</p>
                          <p className="text-sm font-body text-muted-foreground mt-0.5">
                            Tap any month to see what happened. Look for your <span className="text-secondary font-semibold">life notes</span>.
                          </p>
                        </div>
                        <p className="text-sm font-body text-muted-foreground shrink-0">
                          {allSnapshots.length} snapshots
                        </p>
                      </div>
                    </CardContent>
                  </Card>

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
                          <div key={cat.id} className="space-y-1">
                            <CategoryTimeline category={cat} snapshots={allSnapshots} />
                            <button
                              onClick={() => {
                                setReminderDefaults({ text: `Improve ${cat.name} this month`, categoryId: cat.id });
                                setReminderSheet(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-primary transition-colors ml-1 min-h-[32px]"
                            >
                              <Bell className="h-3 w-3" /> Set reminder
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <SetReminderSheet
              open={reminderSheet}
              onOpenChange={setReminderSheet}
              defaultText={reminderDefaults.text}
              defaultCategoryId={reminderDefaults.categoryId}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* CategoryScoringCard — the focused, one-at-a-time card      */
/* ═══════════════════════════════════════════════════════════ */

interface CategoryScoringCardProps {
  category: SnapshotCategory;
  rating: SnapshotRating;
  previousRating?: SnapshotRating;
  onUpdateRating: (field: keyof SnapshotRating, value: number) => void;
  userName: string;
  allSnapshots: any[];
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
}

function CategoryScoringCard({
  category, rating, previousRating, onUpdateRating,
  userName, allSnapshots, ratings, previousRatings,
}: CategoryScoringCardProps) {
  const score = rating?.score ?? 5;
  const firstName = userName.split(' ')[0];

  // Mentor AI state
  const [mentorMsg, setMentorMsg] = useState('');
  const [mentorInput, setMentorInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const hasTriggered = useRef(false);

  // Auto-trigger mentor on card mount
  useEffect(() => {
    hasTriggered.current = false;
    setMentorMsg('');
    setMentorInput('');
  }, [category.id]);

  useEffect(() => {
    if (hasTriggered.current || isStreaming) return;
    hasTriggered.current = true;

    const prevScore = previousRating?.score;
    let prompt: string;
    if (prevScore !== undefined) {
      const delta = score - prevScore;
      if (delta > 0) {
        prompt = `The user "${firstName}" is scoring "${category.name}" at ${score}/10 (up from ${prevScore}). Ask ONE warm question about what improved. 2 sentences max. Be personal.`;
      } else if (delta < 0) {
        prompt = `The user "${firstName}" is scoring "${category.name}" at ${score}/10 (down from ${prevScore}). Ask ONE gentle question about what happened. 2 sentences max. Be caring, not clinical.`;
      } else {
        prompt = `The user "${firstName}" is scoring "${category.name}" at ${score}/10 (same as last month ${prevScore}). Give a brief reflection prompt. 1-2 sentences.`;
      }
    } else {
      prompt = `The user "${firstName}" is scoring "${category.name}" at ${score}/10. Ask "What's behind that number for you this month?" in a warm, personal way. 2 sentences max.`;
    }

    setIsStreaming(true);
    let content = '';
    streamChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'consultant',
      onDelta: (chunk) => { content += chunk; setMentorMsg(content); },
      onDone: () => setIsStreaming(false),
      onError: () => { setIsStreaming(false); setMentorMsg(`${firstName}, what's behind that number for you this month?`); },
    });
  }, [category.id, firstName]);

  const sendReply = (text: string) => {
    if (!text.trim() || isStreaming) return;
    setMentorInput('');
    setIsStreaming(true);

    const context = `User "${firstName}" is on "${category.name}" (score ${score}/10). They said: "${text}". Respond briefly with empathy and maybe one follow-up. 2-3 sentences max. Be a wise friend, not a therapist.`;

    let content = '';
    streamChat({
      messages: [{ role: 'user', content: context }],
      mode: 'consultant',
      onDelta: (chunk) => { content += chunk; setMentorMsg(content); },
      onDone: () => setIsStreaming(false),
      onError: () => setIsStreaming(false),
    });
  };

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Category header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">{category.name}</h2>
          <p className="text-sm font-body italic text-secondary">{category.scriptureRef}</p>
          {category.description && (
            <p className="text-sm font-body text-muted-foreground mt-1 max-w-md mx-auto">{category.description}</p>
          )}
        </div>

        {/* Score display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center h-24 w-24 rounded-2xl ${getScoreBg(score)} transition-colors`}>
            <span className={`text-5xl font-heading font-bold ${getScoreColor(score)} transition-colors`}>{score}</span>
          </div>
        </div>

        {/* Main slider */}
        <div className="space-y-3 px-2">
          <Slider
            value={[score]}
            onValueChange={([v]) => onUpdateRating('score', v)}
            min={1} max={10} step={1}
            className="py-2 [&_[role=slider]]:h-7 [&_[role=slider]]:w-7"
          />
          <div className="flex justify-between text-xs font-body text-muted-foreground">
            <span>1 = worst it's been</span>
            <span>10 = best ever</span>
          </div>
        </div>

        {/* Previous score context */}
        {previousRating && (
          <p className="text-center text-sm font-body text-muted-foreground">
            Last month: <span className="font-semibold">{previousRating.score}</span>
            {score !== previousRating.score && (
              <span className={`ml-1 font-bold ${score > previousRating.score ? 'text-primary' : 'text-destructive'}`}>
                ({score > previousRating.score ? '↑' : '↓'} {Math.abs(score - previousRating.score)})
              </span>
            )}
          </p>
        )}

        {/* Spouse / Child sliders */}
        {category.hasSpouseRating && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-body text-muted-foreground">How would your spouse rate this?</Label>
              <span className="text-sm font-heading font-bold">{rating?.spouseScore ?? 5}</span>
            </div>
            <Slider
              value={[rating?.spouseScore ?? 5]}
              onValueChange={([v]) => onUpdateRating('spouseScore', v)}
              min={1} max={10} step={1}
              className="py-1"
            />
          </div>
        )}

        {category.hasChildRating && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-body text-muted-foreground">How would your children rate this?</Label>
              <span className="text-sm font-heading font-bold">{rating?.childScore ?? 5}</span>
            </div>
            <Slider
              value={[rating?.childScore ?? 5]}
              onValueChange={([v]) => onUpdateRating('childScore', v)}
              min={1} max={10} step={1}
              className="py-1"
            />
          </div>
        )}

        {/* Mentor section */}
        <div className="pt-4 border-t border-border/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-foreground">James</p>
              <p className="text-xs font-body text-muted-foreground">Your AI Mentor</p>
            </div>
          </div>

          {mentorMsg && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="prose prose-sm max-w-none font-body text-[15px] leading-relaxed text-foreground/90 [&_p]:mb-1">
                <ReactMarkdown>{mentorMsg}</ReactMarkdown>
              </div>
            </div>
          )}

          {!isStreaming && mentorMsg && (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="font-body text-sm min-h-[40px]" onClick={() => sendReply('Tell me more about what you see')}>
                  Tell me more
                </Button>
                <Button variant="outline" size="sm" className="font-body text-sm min-h-[40px]" onClick={() => sendReply('Something happened this month I want to share')}>
                  Something happened
                </Button>
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={mentorInput}
                  onChange={(e) => setMentorInput(e.target.value)}
                  placeholder="Reply to James..."
                  className="text-sm font-body min-h-[44px] resize-none"
                  rows={1}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(mentorInput); } }}
                />
                <Button
                  size="sm"
                  className="shrink-0 min-h-[44px]"
                  onClick={() => sendReply(mentorInput)}
                  disabled={!mentorInput.trim() || isStreaming}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {isStreaming && (
            <div className="flex gap-1.5 items-center text-xs font-body text-muted-foreground">
              <div className="flex gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce [animation-delay:300ms]" />
              </div>
              James is reflecting...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
