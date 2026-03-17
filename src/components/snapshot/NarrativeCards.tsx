import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ChevronDown } from 'lucide-react';
import { CategorySparkline } from './CategorySparkline';
import { CATEGORY_COLORS } from './TrendChart';
import { useReminders } from '@/hooks/use-reminders';
import { useToast } from '@/hooks/use-toast';
import type { Snapshot, SnapshotCategory } from '@/types';

interface NarrativeCardsProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
  userName: string;
}

interface NarrativeCard {
  categoryId: string;
  category: SnapshotCategory;
  firstScore: number;
  lastScore: number;
  delta: number;
  impactRank: number;
  narrative: string;
  scripture: string;
  actionText?: string;
}

function getScoreBadgeClass(score: number): string {
  if (score <= 3) return 'bg-destructive/15 text-destructive border-destructive/30';
  if (score <= 6) return 'bg-secondary/15 text-secondary border-secondary/30';
  return 'bg-primary/15 text-primary border-primary/30';
}

/** Demo narratives — hardcoded for the Jonathan Almanzar persona */
const DEMO_NARRATIVES: Record<string, { narrative: string; scripture: string; action?: string }> = {
  marriageSelf: {
    narrative: "Jonathan, your marriage hit rock bottom at 3 in August. Sarah told you she felt lonely — and you heard her. The fact that you're back at 6 tells me date nights are working. Don't stop. The gap between your score and Sarah's is still real, but it's closing.",
    scripture: '"Love is patient, love is kind" — 1 Corinthians 13:4',
    action: 'Protect weekly date night this month',
  },
  marriageSpouse: {
    narrative: "Sarah went from 2 to 5. That's huge, brother. She's seeing change. But a 5 still says 'I need more.' Keep listening. Keep showing up. She's not asking for perfection — she's asking for presence.",
    scripture: '"Husbands, love your wives, as Christ loved the church" — Ephesians 5:25',
  },
  physicalHealth: {
    narrative: "Brother, your body is sending you a message. From 7 to 4 — the doctor flagged your blood pressure, you put on 20 lbs, and you fell off the workout routine again. Travel is the excuse, but your family needs you healthy for decades, not just this quarter.",
    scripture: '"Do you not know that your bodies are temples of the Holy Spirit?" — 1 Corinthians 6:19',
    action: 'Block 3 mornings for exercise this week',
  },
  mentalHealth: {
    narrative: "Mental health at 5 — bouncing between 4 and 6 all year. The burnout symptoms, the sleepless nights, the short temper. You told your Forum brothers and they prayed over you. That took courage. But prayer without action is just wishing.",
    scripture: '"Cast all your anxiety on him because he cares for you" — 1 Peter 5:7',
    action: 'Schedule one thing to remove from your plate this week',
  },
  sales: {
    narrative: "From 4 to 9 in 12 months — God has gifted you here, Jonathan. The $1.2M deal, the overflowing pipeline, back-to-back records. But I have to ask: is this success costing your family? Sales doesn't need you on the road every week. Sarah does.",
    scripture: '"For what does it profit a man to gain the whole world and forfeit his soul?" — Mark 8:36',
  },
  intimacyWithJesus: {
    narrative: "Your faith oscillates — 7 after retreats and Bible study, 3 when travel picks up. That tells me your spiritual life responds to events, not daily discipline. The men's Bible study helped. What if you committed to 10 minutes in the Word before your first meeting?",
    scripture: '"Abide in me, and I in you. As the branch cannot bear fruit by itself." — John 15:4',
    action: 'Commit to 10 min daily devotional before first meeting',
  },
  marketing: {
    narrative: "3-4 all year. You tried Facebook ads and wasted $2K. A Forum brother offered you a connection — did you follow up? You're finally interviewing for a marketing director. Don't let this slip again. This is the lever that unlocks scale without more travel.",
    scripture: '"See, I am doing a new thing! Do you not perceive it?" — Isaiah 43:19',
    action: 'Finalize marketing director hire by end of month',
  },
  parentingSelf: {
    narrative: "Consistently your strongest area at 8-9. The coaching, the FaceTime calls, the daddy-daughter days. This is a gift, Jonathan. But here's what I want you to hear: they won't always want to FaceTime. The window is open right now. Be there while they still want you there.",
    scripture: '"Train up a child in the way he should go; even when he is old he will not depart from it." — Proverbs 22:6',
  },
  parentingChild: {
    narrative: "Your girls rate you 9 out of 10. Emma told Sarah 'Daddy is the best.' You don't need to fix this one — just keep doing what you're doing, and maybe do a little less of everything else so you can do more of this.",
    scripture: '"Children are a heritage from the Lord, offspring a reward from him." — Psalm 127:3',
  },
  leadership: {
    narrative: "Solid at 7-8 all year, with a slight dip recently. You lead well, but the decline in the last two months mirrors your personal stress. Leadership isn't just about your team's performance — it's about the man behind the decisions. Take care of him.",
    scripture: '"Be shepherds of God\u2019s flock that is under your care, serving as overseers." \u2014 1 Peter 5:2',
  },
  staff: {
    narrative: "Steady at 6-7. Your team is holding, but they're not thriving. You hired a junior rep which helped sales, but have you invested in developing your people? Delegation isn't just about offloading work — it's about building leaders.",
    scripture: '"And the things you have heard me say, entrust to reliable people." — 2 Timothy 2:2',
  },
  operations: {
    narrative: "Consistent 6-7. Operations is your quiet workhorse. No drama, no breakthroughs. That's fine — but don't let 'fine' become 'forgotten.' Systems need attention too.",
    scripture: '"Let all things be done decently and in order." — 1 Corinthians 14:40',
  },
  finances: {
    narrative: "7-8 all year. Finances are solid despite record revenue creating some cash flow complexity. Keep your stewardship sharp — success has a way of making us careless with the details.",
    scripture: '"For which of you, desiring to build a tower, does not first sit down and count the cost?" — Luke 14:28',
  },
};

export function NarrativeCards({ snapshots, categories, userName }: NarrativeCardsProps) {
  const { addReminder } = useReminders();
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);
  const [addedActions, setAddedActions] = useState<Set<string>>(new Set());
  const firstName = userName.split(' ')[0];

  const cards = useMemo(() => {
    if (snapshots.length < 2) return [];
    const chrono = [...snapshots].reverse(); // oldest first

    return categories.map(cat => {
      const scores = chrono.map(s => s.ratings.find(r => r.categoryId === cat.id)?.score ?? null)
        .filter((s): s is number => s !== null);
      if (scores.length === 0) return null;

      const firstScore = scores[0];
      const lastScore = scores[scores.length - 1];
      const delta = lastScore - firstScore;
      // Impact: declining low scores rank highest
      const impactRank = Math.abs(delta) * 2 + (10 - lastScore);

      const demo = DEMO_NARRATIVES[cat.id];

      return {
        categoryId: cat.id,
        category: cat,
        firstScore,
        lastScore,
        delta,
        impactRank,
        narrative: demo?.narrative || `${cat.name} has moved from ${firstScore} to ${lastScore} over ${scores.length} months.`,
        scripture: demo?.scripture || `"${cat.scriptureRef}"`,
        actionText: demo?.action,
      } as NarrativeCard;
    })
    .filter((c): c is NarrativeCard => c !== null)
    .sort((a, b) => b.impactRank - a.impactRank);
  }, [snapshots, categories]);

  const visibleCards = showAll ? cards : cards.slice(0, 5);

  const handleAddAction = (card: NarrativeCard) => {
    if (!card.actionText) return;
    const d = new Date();
    d.setDate(d.getDate() + 7);
    addReminder({
      text: card.actionText,
      categoryId: card.categoryId,
      dueDate: d.toISOString().split('T')[0],
      source: 'ai',
    });
    setAddedActions(prev => new Set(prev).add(card.categoryId));
    toast({ title: 'Action item added', description: `"${card.actionText}" — due in 7 days.` });
  };

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">Your Journey This Month</h2>
        <p className="text-sm font-body text-muted-foreground mt-1">
          {firstName}, here's what stands out from your last {Math.min(12, snapshots.length)} months.
        </p>
      </div>

      {visibleCards.map((card, idx) => {
        const color = CATEGORY_COLORS[card.categoryId] || '#888';
        const actionAdded = addedActions.has(card.categoryId);

        return (
          <Card
            key={card.categoryId}
            className="border-border/60 hover:border-secondary/30 transition-colors overflow-hidden stagger-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <CardContent className="p-4 sm:p-5">
              {/* Header row: badge + name + sparkline + score */}
              <div className="flex items-start gap-3 mb-3">
                {/* Score badge */}
                <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-lg font-heading font-bold ${getScoreBadgeClass(card.lastScore)}`}>
                  {card.lastScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-heading font-bold text-foreground truncate">{card.category.name}</h3>
                    <span className="text-[10px] font-body text-muted-foreground capitalize shrink-0">{card.category.group}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-body text-muted-foreground">
                      {card.firstScore}→{card.lastScore}
                    </span>
                    <span className={`text-xs font-body font-bold ${card.delta > 0 ? 'text-primary' : card.delta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {card.delta > 0 ? '↑' : card.delta < 0 ? '↓' : '—'}{Math.abs(card.delta)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <CategorySparkline
                    categoryId={card.categoryId}
                    snapshots={snapshots}
                    width={100}
                    height={32}
                    color={color}
                  />
                </div>
              </div>

              {/* Narrative */}
              <p className="text-sm font-body text-foreground/85 leading-relaxed mb-2">
                {card.narrative}
              </p>

              {/* Scripture */}
              <blockquote className="border-l-2 border-secondary/40 pl-3 py-1 mb-3">
                <p className="text-xs font-body italic text-secondary">{card.scripture}</p>
              </blockquote>

              {/* Action item */}
              {card.actionText && (
                <div className="pt-2 border-t border-border/30">
                  {actionAdded ? (
                    <p className="text-xs font-body text-primary flex items-center gap-1.5">
                      ✓ Added to your action items
                    </p>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-body gap-1.5 border-secondary/30 hover:bg-secondary/10 hover:border-secondary/50 min-h-[36px]"
                      onClick={() => handleAddAction(card)}
                    >
                      <Bell className="h-3 w-3" /> + {card.actionText}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Show all button */}
      {cards.length > 5 && !showAll && (
        <Button
          variant="ghost"
          className="w-full font-body text-sm text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => setShowAll(true)}
        >
          <ChevronDown className="h-4 w-4" /> Show all {cards.length} categories
        </Button>
      )}
    </div>
  );
}
