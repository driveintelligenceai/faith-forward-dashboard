import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Save, History, Activity, Eye, Pencil, ArrowLeft, ArrowRight, Bell, BookOpen, MessageSquare, Compass, ChevronRight, Send, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AIInsights } from '@/components/snapshot/AIInsights';
import { CategoryTimeline } from '@/components/snapshot/CategoryTimeline';
import { TrendLineChart } from '@/components/snapshot/TrendLineChart';
import { SnapshotPlayback } from '@/components/snapshot/SnapshotPlayback';
import { TrendChart } from '@/components/snapshot/TrendChart';
import { NarrativeCards } from '@/components/snapshot/NarrativeCards';
import { JourneyChat } from '@/components/snapshot/JourneyChat';
import { MobileCompanionSheet } from '@/components/snapshot/MobileCompanionSheet';
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
  const { profile, enterDemoMode, isDemo } = useAuth();
  const { snapshots: dbSnapshots, isLoading, isSaving, saveSnapshot } = useSnapshots();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addReminder } = useReminders();
  const defaultType = profile ? getRoleSnapshotType((profile.role || 'member') as UserRole) : 'member';
  const [snapshotType, setSnapshotType] = useState<SnapshotType>(defaultType);
  const categories = SNAPSHOT_CONFIGS[snapshotType];

  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const latestSaved = allSnapshots[0];

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasCurrentMonth = latestSaved && latestSaved.date.startsWith(currentMonth);

  // URL params: ?mode=score forces score mode, ?view=current shows current tab
  const forceScore = searchParams.get('mode') === 'score';
  const viewCurrent = searchParams.get('view') === 'current';

  // Mode: 'score' or 'review'
  const [mode, setMode] = useState<'score' | 'review'>(forceScore || !hasCurrentMonth ? 'score' : 'review');

  // Pre-fill foundation fields from latest saved data
  const [purposeStatement, setPurposeStatement] = useState(latestSaved?.purposeStatement ?? '');
  const [quarterlyGoal, setQuarterlyGoal] = useState(latestSaved?.quarterlyGoal ?? '');
  const [majorIssue, setMajorIssue] = useState(latestSaved?.majorIssue ?? '');

  // If forced to score mode and foundation is already filled, skip to first category
  const foundationFilled = purposeStatement.trim() || quarterlyGoal.trim() || majorIssue.trim();

  // Step-by-step: 0 = foundation, 1..N = categories, N+1 = summary
  const [step, setStep] = useState(forceScore && foundationFilled ? 1 : 0);

  // React to URL param changes (component doesn't remount on same-route navigation)
  useEffect(() => {
    if (forceScore && mode !== 'score') {
      setMode('score');
      const hasFilled = purposeStatement.trim() || quarterlyGoal.trim() || majorIssue.trim();
      setStep(hasFilled ? 1 : 0);
    }
  }, [forceScore]);
  const totalSteps = categories.length + 2; // foundation + categories + summary

  const [aiSuggestions, setAiSuggestions] = useState<{text: string; categoryId: string}[]>([]);
  const [reminderSheet, setReminderSheet] = useState(false);
  const [reminderDefaults, setReminderDefaults] = useState({ text: '', categoryId: '' });
  const [activeTab, setActiveTab] = useState(viewCurrent ? 'current' : 'journey');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

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

  const updateRating = (catId: string, field: keyof SnapshotRating, value: number | string) => {
    setRatings((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: value } }));
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDemoOffer, setShowDemoOffer] = useState(false);

  const handleSave = async () => {
    setShowConfirmSubmit(false);
    const wasFirstSnapshot = dbSnapshots.length === 0;
    const result = await saveSnapshot(snapshotType, purposeStatement, quarterlyGoal, majorIssue, ratings);
    if (result) {
      setIsFinalized(true);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
        if (wasFirstSnapshot && !isDemo) {
          setShowDemoOffer(true);
        } else {
          setMode('review');
          setActiveTab('current');
        }
      }, 1600);
      // Generate mentor-suggested reminders for declining categories
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

  const personalCategories = categories.filter(c => c.group === 'personal');
  const professionalCategories = categories.filter(c => c.group === 'professional');
  const spiritualCategories = categories.filter(c => c.group === 'spiritual');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl shimmer-gold" />
            <p className="font-body text-muted-foreground">Preparing your Snapshot experience...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-2 sm:space-y-3">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-heading font-bold tracking-tight text-primary">
              {SNAPSHOT_TYPE_LABELS[snapshotType]}
            </h1>
            <p className="text-sm sm:text-base font-body text-muted-foreground mt-1">
              {mode === 'score'
                ? 'Rate your last 30 days honestly. One area at a time.'
                : 'Your results are in. Review your trends and insights.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasCurrentMonth && !isFinalized && (
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
                <SelectItem value="member" className="text-sm py-2.5">Iron Core</SelectItem>
                <SelectItem value="leader" className="text-sm py-2.5">Iron Edge</SelectItem>
                <SelectItem value="advisor" className="text-sm py-2.5">Iron Pulse</SelectItem>
                <SelectItem value="nonprofit" className="text-sm py-2.5">Iron Mission</SelectItem>
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
              <Card className="border-secondary/20 animate-slide-up-fade">
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

            {/* Steps 1..N: Category Cards — animated transition */}
            {step >= 1 && step <= categories.length && (
              <div key={`cat-${categories[step - 1].id}`} className="animate-slide-up-fade">
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
              </div>
            )}

            {/* Save success overlay */}
            {showSaveSuccess && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-slide-up-fade">
                <div className="text-center space-y-4">
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-secondary/20 animate-confetti-burst" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-12 w-12 text-secondary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" className="animate-check-draw" style={{ strokeDasharray: 24, strokeDashoffset: 0 }} />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xl font-heading font-bold text-primary">Snapshot Submitted</p>
                  <p className="text-sm font-body text-muted-foreground">Well done, brother. Your lead has been notified.</p>
                </div>
              </div>
            )}

            {/* Demo offer for first-time users */}
            {showDemoOffer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-slide-up-fade">
                <Card className="max-w-md mx-4 border-secondary/30 shadow-xl">
                  <CardContent className="p-6 sm:p-8 space-y-5 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-secondary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-heading font-bold text-primary">
                        Welcome to the dashboard, {profile?.full_name?.split(' ')[0] ?? 'Brother'}!
                      </h2>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed">
                        Since this is your first Snapshot, we can show you what 12 months of growth looks like with sample data from another member.
                      </p>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed">
                        This helps James (your AI mentor) give you richer insights by showing trends and patterns.
                      </p>
                    </div>
                    <div className="space-y-3 pt-1">
                      <Button
                        size="lg"
                        className="w-full h-12 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                        onClick={() => {
                          enterDemoMode();
                          setShowDemoOffer(false);
                          setMode('review');
                          setActiveTab('current');
                        }}
                      >
                        <Sparkles className="h-4 w-4" /> Show Me the Demo Journey
                      </Button>
                      <button
                        className="text-sm font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                        onClick={() => {
                          setShowDemoOffer(false);
                          setMode('review');
                          setActiveTab('current');
                        }}
                      >
                        No thanks, show my baseline only
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Final Step: Summary */}
            {step === totalSteps - 1 && (
              <Card className="border-secondary/20 animate-slide-up-fade">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">Your Snapshot Summary</h2>
                    <p className="text-5xl font-heading font-bold text-secondary score-transition">{avgScore}</p>
                    <p className="text-sm font-body text-muted-foreground">Overall Average · {categories.length} categories</p>
                  </div>

                  <div className="space-y-2">
                    {categories.map(cat => {
                      const score = ratings[cat.id]?.score ?? 5;
                      const prevScore = previousRatings?.[cat.id]?.score;
                      const delta = prevScore !== undefined ? score - prevScore : null;
                      const lifeEvent = ratings[cat.id]?.lifeEvent;
                      const note = ratings[cat.id]?.note;
                      return (
                        <div key={cat.id} className={`p-3 rounded-lg ${getScoreBorder(score)}`}>
                          <div className="flex items-center justify-between">
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
                          {lifeEvent && (
                            <p className="text-xs font-body text-muted-foreground mt-1 italic">{lifeEvent}</p>
                          )}
                          {note && (
                            <p className="text-xs font-body text-foreground/70 mt-0.5">{note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    size="lg"
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={isSaving || showSaveSuccess}
                    className="w-full h-14 text-base font-heading font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                  >
                    {isSaving ? (
                      <><div className="h-5 w-5 rounded-full shimmer-gold" /> Submitting...</>
                    ) : (
                      <><Send className="h-5 w-5" /> Submit to My Lead</>
                    )}
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
            {/* Mentor suggestion cards after save */}
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

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== 'current') setSearchParams({}); }} className="space-y-2 sm:space-y-3">
              <TabsList className="p-1 sm:p-1.5 gap-0 font-body w-full flex">
                <TabsTrigger value="current" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <Eye className="h-4 w-4" /> Current
                </TabsTrigger>
                <TabsTrigger value="journey" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <Compass className="h-4 w-4" /> Journey
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <Activity className="h-4 w-4" /> Insights
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1.5 font-body font-semibold text-xs sm:text-base px-2 sm:px-5 py-2 sm:py-2.5 min-h-[44px]">
                  <History className="h-4 w-4" /> History
                </TabsTrigger>
              </TabsList>

              {/* CURRENT TAB — latest month's scores at a glance */}
              <TabsContent value="current">
                <div className="space-y-4">
                  {latestSaved && (
                    <>
                      <Card className="border-secondary/20 bg-secondary/5">
                        <CardContent className="p-6 sm:p-8 text-center">
                          <p className="text-xs font-body text-muted-foreground uppercase tracking-wide mb-1">
                            {new Date(latestSaved.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-6xl sm:text-7xl font-heading font-bold text-secondary">{avgScore}</p>
                          <p className="text-sm font-body text-muted-foreground mt-2">Overall Score · {categories.length} categories</p>
                          {previousRatings && (
                            <p className="text-xs font-body text-muted-foreground mt-1">
                              {(() => {
                                const prevAvg = categories.reduce((s, c) => s + (previousRatings[c.id]?.score ?? 5), 0) / categories.length;
                                const delta = parseFloat(avgScore) - prevAvg;
                                return delta > 0 ? `↑ Up ${delta.toFixed(1)} from previous month` : delta < 0 ? `↓ Down ${Math.abs(delta).toFixed(1)} from previous month` : 'Same as previous month';
                              })()}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 sm:p-6">
                          <h3 className="text-lg font-heading font-bold text-primary mb-3">Category Scores</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

                      {latestSaved.purposeStatement && (
                        <Card>
                          <CardContent className="p-4 sm:p-6 space-y-3">
                            {latestSaved.purposeStatement && (
                              <div>
                                <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide">Purpose</p>
                                <p className="text-sm font-body text-foreground mt-0.5">{latestSaved.purposeStatement}</p>
                              </div>
                            )}
                            {latestSaved.quarterlyGoal && (
                              <div>
                                <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide">Quarterly Goal</p>
                                <p className="text-sm font-body text-foreground mt-0.5">{latestSaved.quarterlyGoal}</p>
                              </div>
                            )}
                            {latestSaved.majorIssue && (
                              <div>
                                <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide">Prayer Request</p>
                                <p className="text-sm font-body text-foreground mt-0.5">{latestSaved.majorIssue}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* JOURNEY TAB — hero: radar + chat side-by-side */}
              <TabsContent value="journey">
                <div className="space-y-4">
                  {/* Hero: Radar + AI Chat */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Radar chart */}
                    <div className="lg:flex-1 lg:min-w-0">
                      <SnapshotPlayback snapshots={allSnapshots} categories={categories} />
                    </div>
                    {/* AI Chat — desktop only (mobile uses bottom sheet) */}
                    <div className="hidden lg:block lg:w-[380px] xl:w-[420px] lg:shrink-0">
                      <div className="h-[580px] sticky top-4">
                        <JourneyChat
                          snapshots={allSnapshots}
                          categories={categories}
                          userName={profile?.full_name ?? 'Brother'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Talk to James button */}
                  <div className="lg:hidden">
                    <Button
                      onClick={() => setMobileChatOpen(true)}
                      className="w-full h-12 font-heading font-bold text-base gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    >
                      <MessageSquare className="h-5 w-5" /> Talk to James
                    </Button>
                  </div>

                  <TrendChart snapshots={allSnapshots} categories={categories} />
                  <NarrativeCards
                    snapshots={allSnapshots}
                    categories={categories}
                    userName={profile?.full_name ?? 'Brother'}
                  />
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

              {/* HISTORY TAB — trend lines + per-category detail */}
              <TabsContent value="history">
                <div className="space-y-6">
                  {/* Trend line chart at top */}
                  <TrendLineChart snapshots={allSnapshots} categories={categories} />

                  {/* Per-category heatmap detail */}
                  <Card className="border-secondary/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-heading font-bold">Category Detail</p>
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

            {/* Mobile journey chat sheet */}
            <MobileCompanionSheet
              open={mobileChatOpen}
              onOpenChange={setMobileChatOpen}
              currentCategory={null}
              ratings={ratings}
              previousRatings={previousRatings}
              userName={profile?.full_name ?? 'Brother'}
              allSnapshots={allSnapshots}
              categories={categories}
              mode="journey"
            />
          </>
        )}
        {/* Submit confirmation dialog */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-heading font-bold text-primary">
                Submit Your Snapshot?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base font-body text-muted-foreground space-y-2">
                <span className="block">
                  Once submitted, your Snapshot will be sent to your chapter facilitator and cannot be edited.
                </span>
                <span className="block font-semibold text-foreground">
                  Overall Score: {avgScore} across {categories.length} categories
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-heading font-bold min-h-[44px]">
                Go Back & Edit
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="font-heading font-bold min-h-[44px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                Yes, Submit to My Lead
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* Category-specific prompts — questions James asks the user  */
/* ═══════════════════════════════════════════════════════════ */

const CATEGORY_PROMPTS: Record<string, [string, string]> = {
  intimacyWithJesus: [
    "What\u2019s drawn you closer to God this month?",
    "Has anything pulled you away from the Word lately?",
  ],
  marriageSelf: [
    "How present have you been for your wife?",
    "What would she say you could do better?",
  ],
  marriageSpouse: [
    "What would she say if I asked her right now?",
    "When did you last ask how she\u2019s really doing?",
  ],
  parentingSelf: [
    "What moment with your kids are you most proud of?",
    "Are they getting your best hours or your leftovers?",
  ],
  parentingChild: [
    "What would your kids say about your presence?",
    "When did you last get on their level and just listen?",
  ],
  staff: [
    "How well do you know what your team actually needs?",
    "Is anyone on your team struggling that you\u2019re missing?",
  ],
  sales: [
    "Are you chasing numbers or genuinely serving clients?",
    "What\u2019s the biggest opportunity you\u2019re leaving on the table?",
  ],
  marketing: [
    "Where are you showing up consistently right now?",
    "What story is your brand telling without you?",
  ],
  operations: [
    "What system keeps breaking that you haven\u2019t fixed?",
    "What falls through the cracks most often?",
  ],
  finances: [
    "Are you being a faithful steward of what God gave you?",
    "What\u2019s keeping you up at night financially?",
  ],
  leadership: [
    "Who are you actively developing right now?",
    "Are you leading with vision or just putting out fires?",
  ],
  mentalHealth: [
    "What\u2019s weighing on you that you haven\u2019t said out loud?",
    "How are you really sleeping these days?",
  ],
  physicalHealth: [
    "What is your body telling you that you\u2019re ignoring?",
    "Are you honoring the temple God gave you?",
  ],
  mentoring: [
    "Who are you pouring into right now?",
    "What wisdom did you pass along this month?",
  ],
  lifeLessons: [
    "What did failure teach you recently?",
    "What would you tell your younger self right now?",
  ],
  progressGoals: [
    "Are you closer to your biggest goal than last month?",
    "What\u2019s the one thing blocking your top priority?",
  ],
  lessonsScripture: [
    "What is God teaching you through His Word right now?",
    "Which verse has been speaking directly to your situation?",
  ],
  teamManagement: [
    "How is your team really doing beneath the surface?",
    "Who on your team needs your attention the most?",
  ],
};

const DEFAULT_PROMPTS: [string, string] = [
  "What\u2019s behind that number for you?",
  "What changed this month in this area?",
];

/* ═══════════════════════════════════════════════════════════ */
/* CategoryScoringCard — the focused, one-at-a-time card      */
/* ═══════════════════════════════════════════════════════════ */

interface CategoryScoringCardProps {
  category: SnapshotCategory;
  rating: SnapshotRating;
  previousRating?: SnapshotRating;
  onUpdateRating: (field: keyof SnapshotRating, value: number | string) => void;
  userName: string;
  allSnapshots: Snapshot[];
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
}

function CategoryScoringCard({
  category, rating, previousRating, onUpdateRating,
  userName, allSnapshots, ratings, previousRatings,
}: CategoryScoringCardProps) {
  const score = rating?.score ?? 5;
  const firstName = userName.split(' ')[0];

  // Mentor state
  const [mentorMsg, setMentorMsg] = useState('');
  const [mentorInput, setMentorInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const hasTriggered = useRef(false);
  const lastAiScore = useRef(score);
  const isStreamingRef = useRef(false);

  // Reset mentor state on category change
  useEffect(() => {
    hasTriggered.current = false;
    lastAiScore.current = rating?.score ?? 5;
    setMentorMsg('');
    setMentorInput('');
  }, [category.id]);

  // Auto-trigger mentor on card mount — references previous score BEFORE slider moves
  useEffect(() => {
    if (hasTriggered.current || isStreaming) return;
    hasTriggered.current = true;

    const prevScore = previousRating?.score;
    let prompt: string;
    if (prevScore !== undefined) {
      prompt = `You are James, a warm accountability partner. The user "${firstName}" just landed on "${category.name}". Their score last month was ${prevScore}/10. Before they move the slider, ask them ONE contextual question that references their previous score and invites them to reflect on whether things have changed. Example tone: "You were a ${prevScore} last month in ${category.name}. Are you feeling more optimistic this time around?" Be personal, 2 sentences max. Don't mention the current score — they haven't scored yet.`;
    } else {
      prompt = `You are James, a warm accountability partner. The user "${firstName}" is scoring "${category.name}" for the first time ever — this is their baseline. Encourage them to take a moment to think honestly about where they stand. Example tone: "This is your first time rating ${category.name}. Take a moment to think about where you honestly stand." Be warm, 2 sentences max.`;
    }

    isStreamingRef.current = true;
    setIsStreaming(true);
    let content = '';
    streamChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'consultant',
      onDelta: (chunk) => { content += chunk; setMentorMsg(content); },
      onDone: () => { isStreamingRef.current = false; setIsStreaming(false); },
      onError: () => { isStreamingRef.current = false; setIsStreaming(false); setMentorMsg(`${firstName}, what's behind that number for you this month?`); },
    });
  }, [category.id, firstName]);

  // Debounced follow-up when user changes score via slider
  useEffect(() => {
    // Don't trigger on mount or if AI hasn't done the initial prompt yet
    if (!hasTriggered.current) return;
    // Only trigger when score differs from the last score that triggered AI
    if (score === lastAiScore.current) return;

    const timer = setTimeout(() => {
      // Guard against triggering while already streaming (use ref for current value)
      if (isStreamingRef.current) return;

      const oldScore = lastAiScore.current;
      lastAiScore.current = score;

      const prevMonthScore = previousRating?.score;
      let prompt: string;

      if (score > oldScore) {
        prompt = `You are James, a warm accountability partner. The user "${firstName}" just moved their "${category.name}" score from ${oldScore} to ${score}/10. That's an increase. Ask ONE brief, warm follow-up about what changed that makes them feel more confident. ${prevMonthScore !== undefined ? `Their score last month was ${prevMonthScore}.` : ''} 2 sentences max.`;
      } else if (score < oldScore) {
        prompt = `You are James, a warm accountability partner. The user "${firstName}" just moved their "${category.name}" score from ${oldScore} down to ${score}/10. That's a drop. Ask ONE gentle question about what happened — be caring, not clinical. ${prevMonthScore !== undefined ? `Their score last month was ${prevMonthScore}.` : ''} 2 sentences max.`;
      } else if (prevMonthScore !== undefined && score === prevMonthScore) {
        prompt = `You are James, a warm accountability partner. The user "${firstName}" set their "${category.name}" score to ${score}/10 — same as last month (${prevMonthScore}). Ask briefly whether that sameness reflects stability or stagnation. Be warm. 2 sentences max.`;
      } else {
        return; // No meaningful change to comment on
      }

      isStreamingRef.current = true;
      setIsStreaming(true);
      let content = '';
      streamChat({
        messages: [{ role: 'user', content: prompt }],
        mode: 'consultant',
        onDelta: (chunk) => { content += chunk; setMentorMsg(content); },
        onDone: () => { isStreamingRef.current = false; setIsStreaming(false); },
        onError: () => { isStreamingRef.current = false; setIsStreaming(false); },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [score, category.id, category.name, firstName, previousRating?.score]);

  const sendReply = (text: string) => {
    if (!text.trim() || isStreaming) return;
    setMentorInput('');
    isStreamingRef.current = true;
    setIsStreaming(true);

    const context = `User "${firstName}" is on "${category.name}" (score ${score}/10). They said: "${text}". Respond briefly with empathy and maybe one follow-up. 2-3 sentences max. Be a wise friend, not a therapist.`;

    let content = '';
    streamChat({
      messages: [{ role: 'user', content: context }],
      mode: 'consultant',
      onDelta: (chunk) => { content += chunk; setMentorMsg(content); },
      onDone: () => { isStreamingRef.current = false; setIsStreaming(false); },
      onError: () => { isStreamingRef.current = false; setIsStreaming(false); },
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

        {/* Score display — animates on change */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center h-24 w-24 rounded-2xl ${getScoreBg(score)} transition-all duration-300`}>
            <span className={`text-5xl font-heading font-bold ${getScoreColor(score)} score-transition`} key={score}>{score}</span>
          </div>
        </div>

        {/* Main slider — extra-large thumb for touch */}
        <div className="space-y-3 px-2">
          <Slider
            value={[score]}
            onValueChange={([v]) => onUpdateRating('score', v)}
            min={1} max={10} step={1}
            aria-label={`Rate ${category.name} from 1 to 10`}
            className="py-2 [&_[role=slider]]:h-8 [&_[role=slider]]:w-8 [&_[role=slider]]:border-secondary [&_[role=slider]]:shadow-md"
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

        {/* Life event & notes */}
        <div className="space-y-3 pt-3 border-t border-border/30">
          <div className="space-y-2">
            <Label className="text-sm font-heading font-semibold text-foreground">What happened this month?</Label>
            <Textarea
              value={rating?.lifeEvent ?? ''}
              onChange={(e) => onUpdateRating('lifeEvent', e.target.value)}
              placeholder="Any event, conversation, or shift that affected this area..."
              className="text-sm font-body min-h-[56px] resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-heading font-semibold text-foreground">Notes for your facilitator</Label>
            <Textarea
              value={rating?.note ?? ''}
              onChange={(e) => onUpdateRating('note', e.target.value)}
              placeholder="Anything you want your lead to know about this score..."
              className="text-sm font-body min-h-[56px] resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Mentor section */}
        <div className="pt-4 border-t border-border/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-foreground">James</p>
              <p className="text-xs font-body text-muted-foreground">Your Accountability Partner</p>
            </div>
          </div>

          {mentorMsg && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="prose prose-sm max-w-none font-body text-[15px] leading-relaxed text-foreground/90 [&_p]:mb-1">
                <ReactMarkdown>{mentorMsg}</ReactMarkdown>
              </div>
            </div>
          )}

          {!isStreaming && mentorMsg && (() => {
            const [prompt1, prompt2] = CATEGORY_PROMPTS[category.id] ?? DEFAULT_PROMPTS;
            return (
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="font-body text-sm min-h-[40px] text-left whitespace-normal" onClick={() => sendReply(prompt1)}>
                    {prompt1}
                  </Button>
                  <Button variant="outline" size="sm" className="font-body text-sm min-h-[40px] text-left whitespace-normal" onClick={() => sendReply(prompt2)}>
                    {prompt2}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    placeholder="Tell James what's on your heart..."
                    className="text-sm font-body min-h-[44px] resize-none"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(mentorInput); } }}
                  />
                  <Button
                    size="sm"
                    className="shrink-0 min-h-[44px] bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    onClick={() => sendReply(mentorInput)}
                    disabled={!mentorInput.trim() || isStreaming}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })()}

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
