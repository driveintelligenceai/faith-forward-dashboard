import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { streamChat } from '@/lib/ai-stream';
import { SNAPSHOT_CONFIGS } from '@/data/snapshot-categories';
import type { SnapshotType, SnapshotCategory } from '@/types';
import { SNAPSHOT_TYPE_LABELS } from '@/types';
import ReactMarkdown from 'react-markdown';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';
import {
  Bot, Send, ChevronRight, ChevronLeft, User, Building2,
  MapPin, Target, BookOpen, Check, Sparkles, ArrowRight
} from 'lucide-react';

/* ────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────── */

type Step = 'welcome' | 'profile' | 'snapshot-type' | 'baseline' | 'goals' | 'complete';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/* ────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────── */

export default function Onboarding() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Steps
  const [step, setStep] = useState<Step>('welcome');
  const STEPS: Step[] = ['welcome', 'profile', 'snapshot-type', 'baseline', 'goals', 'complete'];
  const stepIndex = STEPS.indexOf(step);

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [companyTitle, setCompanyTitle] = useState(profile?.company_title || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [chapter, setChapter] = useState(profile?.chapter || '');

  // Snapshot type
  const [snapshotType, setSnapshotType] = useState<SnapshotType>('member');

  // Baseline ratings
  const categories = SNAPSHOT_CONFIGS[snapshotType] || SNAPSHOT_CONFIGS.member;
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [currentCatIndex, setCurrentCatIndex] = useState(0);

  // Goals
  const [purposeStatement, setPurposeStatement] = useState('');
  const [quarterlyGoal, setQuarterlyGoal] = useState('');
  const [majorIssue, setMajorIssue] = useState('');

  // AI chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  // Send welcome message from AI when component mounts
  useEffect(() => {
    const firstName = profile?.full_name?.split(' ')[0] || 'brother';
    setChatMessages([{
      id: '1',
      role: 'assistant',
      content: `Welcome${firstName !== 'brother' ? `, ${firstName}` : ''}! I'm your Iron Forums AI guide. I'll walk you through setting up your profile and establishing your baseline numbers.\n\nThis is where your journey begins — **honest self-assessment** is the foundation of real growth.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nLet's start whenever you're ready. Click **Get Started** below.`,
    }]);
  }, []);

  // AI helper
  const sendToAI = useCallback(async (userText: string, autoPrompt = false) => {
    if (isStreaming) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: userText };
    if (!autoPrompt) setChatMessages(prev => [...prev, userMsg]);

    setIsStreaming(true);
    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();

    // Build context about current state
    const context = buildOnboardingContext();
    const allMessages = [
      ...chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: autoPrompt ? `[System: ${userText}]\n${context}` : `${context}\n\n${userText}` },
    ];

    await streamChat({
      messages: allMessages,
      mode: 'onboarding',
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        const content = assistantSoFar;
        setChatMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
          }
          return [...prev, { id: assistantId, role: 'assistant', content }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => {
        setIsStreaming(false);
        toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
      },
    });
  }, [chatMessages, isStreaming, toast, step, ratings, snapshotType, fullName, companyName, purposeStatement, quarterlyGoal, majorIssue]);

  function buildOnboardingContext(): string {
    const parts: string[] = [];
    parts.push(`Onboarding step: ${step}`);
    if (fullName) parts.push(`Name: ${fullName}`);
    if (companyName) parts.push(`Company: ${companyName}, ${companyTitle}`);
    if (city && state) parts.push(`Location: ${city}, ${state}`);
    parts.push(`Snapshot type: ${SNAPSHOT_TYPE_LABELS[snapshotType]}`);

    const rated = Object.entries(ratings);
    if (rated.length > 0) {
      const avg = (rated.reduce((s, [, v]) => s + v, 0) / rated.length).toFixed(1);
      parts.push(`Rated ${rated.length}/${categories.length} categories, avg: ${avg}/10`);
      rated.forEach(([id, score]) => {
        const cat = categories.find(c => c.id === id);
        if (cat) parts.push(`${cat.name}: ${score}/10`);
      });
    }
    if (purposeStatement) parts.push(`Purpose: "${purposeStatement}"`);
    if (quarterlyGoal) parts.push(`Goal: "${quarterlyGoal}"`);
    if (majorIssue) parts.push(`Issue: "${majorIssue}"`);

    return `[Onboarding context: ${parts.join('. ')}]`;
  }

  // Step transitions with AI prompts
  const goToStep = (nextStep: Step) => {
    setStep(nextStep);
    const prompts: Partial<Record<Step, string>> = {
      profile: "The user is now filling out their profile. Encourage them briefly — name, company, location. Keep it warm and short.",
      'snapshot-type': "The user is choosing their snapshot type. Briefly explain the difference between Member, Leader, Advisor, and Nonprofit snapshots.",
      baseline: "The user is starting their baseline ratings. Explain that these are their starting numbers — honest assessment matters more than high scores. Be encouraging but direct.",
      goals: "The user has finished their baseline ratings. Now they need to write their purpose statement, quarterly goal, and major issue. Guide them briefly.",
      complete: "The user has completed onboarding! Celebrate their courage in being honest. Summarize what you've learned about them from their ratings and goals. Welcome them to Iron Forums.",
    };
    if (prompts[nextStep]) {
      sendToAI(prompts[nextStep]!, true);
    }
  };

  // Save everything
  const handleComplete = async () => {
    if (!user) {
      toast({ title: 'Not signed in', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Update profile
      await supabase.from('profiles').update({
        full_name: fullName,
        company_name: companyName,
        company_title: companyTitle,
        city, state, chapter,
        snapshot_type: snapshotType,
        onboarding_completed: true,
      }).eq('user_id', user.id);

      // Create baseline snapshot
      const { data: snapshot } = await supabase.from('snapshots').insert({
        user_id: user.id,
        snapshot_type: snapshotType,
        purpose_statement: purposeStatement,
        quarterly_goal: quarterlyGoal,
        major_issue: majorIssue,
      }).select('id').single();

      if (snapshot) {
        const ratingInserts = Object.entries(ratings).map(([categoryId, score]) => ({
          snapshot_id: snapshot.id,
          category_id: categoryId,
          score,
        }));
        await supabase.from('snapshot_ratings').insert(ratingInserts);
      }

      // Save chat history for AI memory
      const chatInserts = chatMessages.map(m => ({
        user_id: user.id,
        role: m.role,
        content: m.content,
        mode: 'onboarding',
      }));
      if (chatInserts.length > 0) {
        await supabase.from('chat_history').insert(chatInserts);
      }

      await refreshProfile();
      toast({ title: 'Welcome to Iron Forums!', description: 'Your baseline is set. Time to grow.' });
      navigate('/');
    } catch (e) {
      toast({ title: 'Error saving', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const currentCat = categories[currentCatIndex];
  const currentScore = currentCat ? (ratings[currentCat.id] || 5) : 5;

  const handleRating = (catId: string, score: number) => {
    setRatings(prev => ({ ...prev, [catId]: score }));
  };

  const nextCategory = () => {
    if (currentCatIndex < categories.length - 1) {
      setCurrentCatIndex(prev => prev + 1);
    }
  };
  const prevCategory = () => {
    if (currentCatIndex > 0) setCurrentCatIndex(prev => prev - 1);
  };

  const allRated = categories.every(c => ratings[c.id] !== undefined);

  // Quick prompts based on step
  const quickPrompts: string[] = step === 'baseline' && currentCat
    ? [`What does "${currentCat.name}" really mean?`, 'Help me rate honestly', 'I need guidance here']
    : step === 'goals'
    ? ['Help me write my purpose statement', 'What makes a good quarterly goal?', "I don't know my biggest issue"]
    : ['Tell me about Iron Forums', 'What will this process look like?', "I'm nervous about being honest"];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ──── LEFT: WIZARD ──── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Progress bar */}
        <div className="bg-card border-b px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <img src={ironForumsLogo} alt="Iron Forums" className="h-8 w-auto" />
            <span className="font-heading text-lg font-bold text-primary">Onboarding</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-body text-muted-foreground mt-2">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">

          {/* WELCOME */}
          {step === 'welcome' && (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Welcome to Iron Forums</h1>
              <p className="text-base font-body text-muted-foreground max-w-md">
                In the next few minutes, you'll set up your profile and establish your baseline — the honest starting point from which real growth begins.
              </p>
              <p className="text-sm font-body text-muted-foreground italic">
                Your AI guide will walk you through every step.
              </p>
              <Button size="lg" className="h-14 px-8 text-lg font-heading font-bold gap-2" onClick={() => goToStep('profile')}>
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* PROFILE */}
          {step === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">About You</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">Tell us about yourself and your business.</p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Smith" className="pl-10 h-12 font-body" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." className="pl-10 h-12 font-body" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">Title</label>
                    <Input value={companyTitle} onChange={e => setCompanyTitle(e.target.value)} placeholder="CEO" className="h-12 font-body" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Suwanee" className="pl-10 h-12 font-body" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">State</label>
                    <Input value={state} onChange={e => setState(e.target.value)} placeholder="Georgia" className="h-12 font-body" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-body font-semibold text-foreground mb-1.5 block">Chapter</label>
                  <Input value={chapter} onChange={e => setChapter(e.target.value)} placeholder="Suwanee Forum" className="h-12 font-body" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="h-12 px-6 font-heading font-bold gap-2"
                  onClick={() => goToStep('snapshot-type')}
                  disabled={!fullName.trim()}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* SNAPSHOT TYPE */}
          {step === 'snapshot-type' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Your Snapshot Type</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">Which best describes your role? This determines your assessment categories.</p>
              </div>

              <div className="grid gap-3">
                {(Object.entries(SNAPSHOT_TYPE_LABELS) as [SnapshotType, string][]).map(([type, label]) => {
                  const catCount = SNAPSHOT_CONFIGS[type].length;
                  return (
                    <button
                      key={type}
                      onClick={() => setSnapshotType(type)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        snapshotType === type
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-heading font-bold text-foreground">{label}</p>
                          <p className="text-sm font-body text-muted-foreground">{catCount} categories</p>
                        </div>
                        {snapshotType === type && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" className="h-12 font-heading gap-2" onClick={() => goToStep('profile')}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button className="h-12 px-6 font-heading font-bold gap-2" onClick={() => { setCurrentCatIndex(0); goToStep('baseline'); }}>
                  Start Baseline <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* BASELINE RATINGS */}
          {step === 'baseline' && currentCat && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                    Category {currentCatIndex + 1} of {categories.length}
                  </p>
                  <h2 className="text-2xl font-heading font-bold text-foreground mt-1">{currentCat.name}</h2>
                </div>
                <span className="text-xs font-body text-secondary font-semibold px-2.5 py-1 bg-secondary/10 rounded-full">
                  {currentCat.scriptureRef}
                </span>
              </div>

              <p className="text-sm font-body text-muted-foreground">{currentCat.description}</p>

              {/* Score selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-muted-foreground">Your honest rating</span>
                  <span className="text-3xl font-heading font-bold text-primary">{currentScore}</span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => handleRating(currentCat.id, n)}
                      className={`h-12 rounded-lg font-heading font-bold text-sm transition-all ${
                        n === currentScore
                          ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                          : n <= currentScore
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-body text-muted-foreground">
                  <span>Struggling</span>
                  <span>Thriving</span>
                </div>
              </div>

              {/* Category mini-progress */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {categories.map((cat, i) => (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentCatIndex(i)}
                    className={`h-8 w-8 rounded-md text-xs font-heading font-bold transition-all ${
                      i === currentCatIndex
                        ? 'bg-primary text-primary-foreground'
                        : ratings[cat.id] !== undefined
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ratings[cat.id] !== undefined ? ratings[cat.id] : '–'}
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  className="h-12 font-heading gap-2"
                  onClick={currentCatIndex === 0 ? () => goToStep('snapshot-type') : prevCategory}
                >
                  <ChevronLeft className="h-4 w-4" /> {currentCatIndex === 0 ? 'Back' : 'Previous'}
                </Button>
                {currentCatIndex < categories.length - 1 ? (
                  <Button
                    className="h-12 px-6 font-heading font-bold gap-2"
                    onClick={nextCategory}
                    disabled={ratings[currentCat.id] === undefined}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className="h-12 px-6 font-heading font-bold gap-2"
                    onClick={() => goToStep('goals')}
                    disabled={!allRated}
                  >
                    Continue to Goals <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* GOALS */}
          {step === 'goals' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Your Vision</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">Set the direction for your journey.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-body font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Purpose Statement
                  </label>
                  <Textarea
                    value={purposeStatement}
                    onChange={e => setPurposeStatement(e.target.value)}
                    placeholder="Why does your work matter? What's your God-given purpose?"
                    className="font-body min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-body font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Quarterly Goal
                  </label>
                  <Textarea
                    value={quarterlyGoal}
                    onChange={e => setQuarterlyGoal(e.target.value)}
                    placeholder="What one thing do you want to accomplish in the next 90 days?"
                    className="font-body min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-body font-semibold text-foreground mb-1.5 flex items-center gap-2">
                    <Target className="h-4 w-4 text-destructive" /> Major Issue
                  </label>
                  <Textarea
                    value={majorIssue}
                    onChange={e => setMajorIssue(e.target.value)}
                    placeholder="What's the biggest challenge or obstacle you're facing right now?"
                    className="font-body min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" className="h-12 font-heading gap-2" onClick={() => goToStep('baseline')}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="h-12 px-6 font-heading font-bold gap-2"
                  onClick={() => goToStep('complete')}
                  disabled={!purposeStatement.trim() || !quarterlyGoal.trim()}
                >
                  Review & Finish <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* COMPLETE */}
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="h-16 w-16 rounded-full bg-primary mx-auto flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground">You're All Set</h2>
                <p className="text-sm font-body text-muted-foreground mt-2 max-w-sm mx-auto">
                  Your baseline is established. From here, the AI will track your growth and get smarter about helping you over time.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-card border rounded-xl p-5 space-y-4">
                <h3 className="font-heading font-bold text-foreground">Your Baseline Summary</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-xs font-body text-muted-foreground truncate mr-2">{cat.name}</span>
                      <span className="font-heading font-bold text-primary text-sm">{ratings[cat.id] || '–'}</span>
                    </div>
                  ))}
                </div>
                {purposeStatement && (
                  <div>
                    <p className="text-xs font-body text-muted-foreground">Purpose</p>
                    <p className="text-sm font-body text-foreground">{purposeStatement}</p>
                  </div>
                )}
                {quarterlyGoal && (
                  <div>
                    <p className="text-xs font-body text-muted-foreground">Quarterly Goal</p>
                    <p className="text-sm font-body text-foreground">{quarterlyGoal}</p>
                  </div>
                )}
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-heading font-bold gap-2"
                onClick={handleComplete}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Enter Iron Forums'} <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ──── RIGHT: AI COMPANION ──── */}
      <div className="w-full lg:w-[400px] xl:w-[440px] border-t lg:border-t-0 lg:border-l bg-card flex flex-col h-[40vh] sm:h-[45vh] lg:h-screen">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-primary">Your AI Guide</p>
              <p className="text-xs font-body text-muted-foreground">I'll remember everything about your journey</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {chatMessages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 border'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed [&_strong]:text-foreground [&_blockquote]:border-secondary [&_blockquote]:text-muted-foreground [&_blockquote]:text-xs [&_p]:mb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm font-body">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isStreaming && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="bg-muted/50 border rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendToAI(prompt)}
              disabled={isStreaming}
              className="text-xs font-body font-semibold px-2.5 py-1 rounded-full border bg-background hover:bg-secondary/10 hover:border-secondary/40 transition-colors text-muted-foreground disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Ask your AI guide anything..."
            className="text-sm font-body h-9"
            onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { sendToAI(chatInput); setChatInput(''); } }}
            disabled={isStreaming}
          />
          <Button
            size="sm"
            className="h-9 px-3 shrink-0"
            onClick={() => { sendToAI(chatInput); setChatInput(''); }}
            disabled={!chatInput.trim() || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
