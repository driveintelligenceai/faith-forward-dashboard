import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useReminders } from '@/hooks/use-reminders';
import { useToast } from '@/hooks/use-toast';
import { Activity, Lightbulb, Bell, MessageSquare, ChevronRight } from 'lucide-react';
import type { Snapshot, SnapshotCategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
  userName: string;
}

interface InsightBlock {
  id: string;
  emoji: string;
  title: string;
  body: string;
  actionText?: string;
  categoryId?: string;
}

const CACHE_KEY = 'ai-insights-cache';

function getCachedInsights(): { content: InsightBlock[]; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
}

function generateDemoInsights(): InsightBlock[] {
  return [
    {
      id: 'marriageSelf',
      emoji: '💛',
      title: 'Jonathan, Sarah needs you.',
      body: `Brother, I want to say this with love because I know your heart: your marriage has gone from a 7 to a 5 this year, and Sarah scored it at 3 last month. She told you she feels lonely — and that took real courage from her.\n\nYou missed your anniversary for a client pitch. You canceled date nights three weeks in a row. I know the business demands feel urgent, but *she* is the mission God gave you first.\n\n> *"What God has joined together, let no one separate." — Mark 10:9*\n\nThe good news? You started date nights again in December and the score moved. That tells me when you show up, she notices. You just have to keep showing up.`,
      actionText: 'Schedule weekly date night for the next month',
      categoryId: 'marriageSelf',
    },
    {
      id: 'sales',
      emoji: '🙏',
      title: 'Your business gift is real — steward it wisely.',
      body: `Sales went from 7 to 9. The $1.2M deal, the overflowing pipeline, back-to-back records — God has clearly gifted you here. I'm proud of you.\n\nBut here's what I want you to sit with: **is this success costing you the things that matter most?** Your sales don't need you on the road every week. Your marriage, your health, your walk with Jesus — they need you *present*.\n\nSuccess without presence is just a highlight reel. And you're building a life, not a highlight reel.`,
    },
    {
      id: 'intimacyWithJesus',
      emoji: '✝️',
      title: 'Your faith is reactive, not rooted.',
      body: `I notice a pattern: your walk with Jesus jumps to 7 when you attend a retreat or men's group, then drops to 5 when travel picks up. That tells me your spiritual life responds to *events* rather than being anchored in daily discipline.\n\nThe men's Bible study in July helped. The retreat in November helped. What if you committed to something that small but consistent — even 10 minutes in the Word before your first meeting?\n\n> *"Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine." — John 15:4*\n\nYou don't need another mountaintop experience, brother. You need a daily rhythm.`,
      actionText: 'Commit to 10 min daily devotional before first meeting',
      categoryId: 'intimacyWithJesus',
    },
    {
      id: 'health',
      emoji: '🫂',
      title: 'Your body is telling you something. Please listen.',
      body: `Physical health dropped from 7 to 4. Mental health is at 5. Your doctor flagged your blood pressure. You put on 15 lbs. You joined a gym and went twice.\n\nI'm not here to shame you — I'm here because I care about you. Your family needs you healthy and present, not just successful. You can't pour from an empty cup, and right now you're running on fumes.\n\nWhat would it look like to protect just three mornings a week for your body? Not for vanity — for your daughters, for Sarah, for the decades ahead.`,
      actionText: 'Block 3 mornings this week for exercise',
      categoryId: 'physicalHealth',
    },
    {
      id: 'parentingSelf',
      emoji: '⭐',
      title: "You're a great dad. Protect that fiercely.",
      body: "Parenting is consistently your strongest area at 8-9, and your girls' scores confirm it. The coaching, the FaceTime calls from the road, the daddy-daughter days — Emma was proud when you coached her soccer team.\n\nThis is a gift, Jonathan. But here's what I want you to hear: **they won't always want to FaceTime.** The window is open right now. Be there while they still want you there.\n\nYou don't need to fix this one. You just need to keep doing what you're doing — and maybe do a little less of everything else so you can do more of this.",
    },
    {
      id: 'marketing',
      emoji: '🎯',
      title: 'Marketing is the lever you keep avoiding.',
      body: `3-4 all year. You tried Facebook ads and wasted $2K. You keep putting off the hire. A Forum brother offered you a connection — did you follow up?\n\nI know marketing doesn't feel urgent when sales is carrying everything. But sales can't carry everything forever. This is the lever that unlocks scale *without* more travel — which is exactly what your family needs.\n\nYou told me you're finally interviewing for a marketing director. **Don't let this slip again.** Want me to help you set a deadline?`,
      actionText: 'Finalize marketing director hire by end of month',
      categoryId: 'marketing',
    },
    {
      id: 'pattern',
      emoji: '💡',
      title: "The real pattern: you give everything to work, and everyone else gets what's left.",
      body: `Jonathan, here's what I see across 12 months: you pour into the business, especially sales. It grows. But marriage, health, and your spiritual life pay the price.\n\nYou're not failing — you're **overextending**. And the men who thrive long-term in this brotherhood are the ones who learn that *less travel and more presence* isn't a business risk — it's the foundation everything else stands on.\n\n> *"For what does it profit a man to gain the whole world and forfeit his soul?" — Mark 8:36*\n\nI believe in you, brother. The question isn't whether you *can* change — it's whether you'll choose to. And I think you will.`,
    },
  ];
}

export function AIInsights({ snapshots, categories, userName }: AIInsightsProps) {
  const { user, profile } = useAuth();
  const { addReminder } = useReminders();
  const { toast } = useToast();
  const [insights, setInsights] = useState<InsightBlock[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const isDemo = profile?.user_id === 'demo';

  useEffect(() => {
    if (snapshots.length < 2) return;

    const cached = getCachedInsights();
    if (cached) { setInsights(cached.content); return; }

    if (isDemo || !user) {
      const content = generateDemoInsights();
      setInsights(content);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content, timestamp: Date.now() }));
      return;
    }

    // Real users would get mentor-generated insights here
    const content = generateDemoInsights();
    setInsights(content);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content, timestamp: Date.now() }));
  }, [user, snapshots.length, isDemo]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddAction = (insight: InsightBlock) => {
    if (!insight.actionText || !insight.categoryId) return;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    addReminder({
      text: insight.actionText,
      categoryId: insight.categoryId,
      dueDate: d.toISOString().split('T')[0],
      source: 'ai',
    });
    setAddedActions(prev => new Set(prev).add(insight.id));
    toast({ title: 'Action item added', description: `"${insight.actionText}" — due in 7 days.` });
  };

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lightbulb className="h-10 w-10 text-secondary/40 mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground">Your story is just beginning</p>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Complete your second monthly Snapshot and James will start spotting patterns in your journey.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-secondary/20 bg-secondary/5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-heading font-bold text-foreground">A word from James</p>
              <p className="text-sm font-body text-muted-foreground mt-0.5">
                {userName.split(' ')[0]}, I spent time looking at your last {Math.min(12, snapshots.length)} months. Here's what's on my heart for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <div className="h-8 w-32 rounded-lg shimmer-gold" />
            <span className="ml-3 text-sm font-body text-muted-foreground">James is studying your journey...</span>
          </CardContent>
        </Card>
      )}

      {/* Insight blocks */}
      {insights && insights.map((insight) => {
        const isExpanded = expandedIds.has(insight.id);
        const actionAdded = addedActions.has(insight.id);

        return (
          <Card key={insight.id} className="border-border/60 hover:border-secondary/30 transition-colors">
            <CardContent className="p-0">
              {/* Clickable header */}
              <button
                onClick={() => toggleExpand(insight.id)}
                className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
              >
                <span className="text-xl mt-0.5 shrink-0">{insight.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-foreground text-[15px] leading-snug">{insight.title}</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expandable body */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="ml-8 border-l-2 border-secondary/20 pl-4 space-y-4">
                    <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed text-foreground/85 [&_strong]:text-foreground [&_blockquote]:border-l-secondary/40 [&_blockquote]:text-secondary [&_blockquote]:italic [&_blockquote]:font-body [&_p]:mb-2.5">
                      <ReactMarkdown>{insight.body}</ReactMarkdown>
                    </div>

                    {/* Action prompt */}
                    {insight.actionText && insight.categoryId && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                        {actionAdded ? (
                          <p className="text-xs font-body text-primary flex items-center gap-1.5">
                            ✓ Added to your action items
                          </p>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-body gap-1.5 border-secondary/30 hover:bg-secondary/10 hover:border-secondary/50 min-h-[36px]"
                            onClick={(e) => { e.stopPropagation(); handleAddAction(insight); }}
                          >
                            <Bell className="h-3 w-3" /> Add to my action items
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
