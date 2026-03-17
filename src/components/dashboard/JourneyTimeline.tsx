import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Snapshot } from '@/types';

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-primary';
  if (score >= 4) return 'bg-secondary';
  return 'bg-destructive';
}

interface MonthCard {
  date: string;
  label: string;
  avg: number;
  delta: number | null;
  dots: { catId: string; catName: string; score: number }[];
}

function buildMonthCards(snapshots: Snapshot[]): MonthCard[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-6);
  const catMap = new Map(SNAPSHOT_CATEGORIES.map(c => [c.id, c.name]));

  return recent.map((snap, i) => {
    const avg = Math.round((snap.ratings.reduce((s, r) => s + r.score, 0) / snap.ratings.length) * 10) / 10;
    const prevSnap = i > 0 ? recent[i - 1] : sorted[sorted.indexOf(snap) - 1];
    let delta: number | null = null;
    if (prevSnap) {
      const prevAvg = Math.round((prevSnap.ratings.reduce((s, r) => s + r.score, 0) / prevSnap.ratings.length) * 10) / 10;
      delta = Math.round((avg - prevAvg) * 10) / 10;
    }

    const d = new Date(snap.date + 'T12:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const dots = snap.ratings.map(r => ({
      catId: r.categoryId,
      catName: catMap.get(r.categoryId) || r.categoryId,
      score: r.score,
    }));

    return { date: snap.date, label, avg, delta, dots };
  });
}

export function JourneyTimeline({ snapshots }: { snapshots: Snapshot[] }) {
  const navigate = useNavigate();
  const cards = buildMonthCards(snapshots);

  if (cards.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Your Journey</h2>
        <p className="text-sm font-body text-muted-foreground">Last {cards.length} months at a glance</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-none">
        {cards.map((card, i) => (
          <Card
            key={card.date}
            className={`shrink-0 w-[180px] sm:w-[200px] cursor-pointer hover:shadow-md transition-all snap-start ${
              i === cards.length - 1 ? 'border-secondary shadow-sm' : ''
            }`}
            onClick={() => navigate('/snapshot')}
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div>
                <p className="text-xs font-body text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                {i === cards.length - 1 && (
                  <span className="text-[10px] font-body font-semibold text-secondary uppercase tracking-wider">
                    Latest
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-heading font-bold text-primary">{card.avg}</span>
                {card.delta !== null && (
                  <span className={`inline-flex items-center text-xs font-body font-bold ${
                    card.delta > 0 ? 'text-primary' : card.delta < 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {card.delta > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : card.delta < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                    {card.delta > 0 ? '+' : ''}{card.delta}
                  </span>
                )}
              </div>

              {/* Category dots with tooltips */}
              <div className="flex flex-wrap gap-1.5" role="list" aria-label="Category scores">
                {card.dots.map(dot => (
                  <div
                    key={dot.catId}
                    role="listitem"
                    className={`h-3 w-3 rounded-full ${getScoreColor(dot.score)}`}
                    title={`${dot.catName}: ${dot.score}/10`}
                    aria-label={`${dot.catName}: ${dot.score} out of 10`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>Strong (7-10)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
          <span>Needs work (4-6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
          <span>Critical (1-3)</span>
        </div>
      </div>
    </div>
  );
}
