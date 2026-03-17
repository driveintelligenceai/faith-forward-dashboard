import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Bookmark } from 'lucide-react';
import type { Snapshot, SnapshotCategory } from '@/types';

interface CategoryTimelineProps {
  category: SnapshotCategory;
  snapshots: Snapshot[];
  className?: string;
}

function getHeatColor(score: number): string {
  if (score >= 8) return 'bg-primary';
  if (score >= 6) return 'bg-secondary';
  if (score >= 4) return 'bg-muted-foreground/30';
  return 'bg-destructive/60';
}

function getHeatLabel(score: number): string {
  if (score >= 8) return 'Strong';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Needs attention';
}

export function CategoryTimeline({ category, snapshots, className }: CategoryTimelineProps) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const monthData = useMemo(() => {
    // snapshots are newest-first; we want oldest-first for display
    const chronological = [...snapshots].reverse();
    return chronological.map((s, idx) => {
      const rating = s.ratings.find(r => r.categoryId === category.id);
      const score = rating?.score ?? 0;
      const lifeEvent = rating?.lifeEvent;
      const spouseScore = rating?.spouseScore;
      const month = new Date(s.date).toLocaleDateString('en-US', { month: 'short' });
      const year = new Date(s.date).getFullYear().toString().slice(2);

      // Calculate delta from previous month
      const prevSnapshot = chronological[idx - 1];
      const prevRating = prevSnapshot?.ratings.find(r => r.categoryId === category.id);
      const delta = prevRating ? score - prevRating.score : 0;

      return { score, delta, month, year, lifeEvent, spouseScore, idx };
    });
  }, [category.id, snapshots]);

  if (monthData.length === 0) return null;

  const latest = monthData[monthData.length - 1];
  const oldest = monthData[0];
  const overallDelta = latest.score - oldest.score;
  const hasLifeEvents = monthData.some(m => m.lifeEvent);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-5">
        {/* Header: Category name + current score + trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-heading font-bold truncate">{category.name}</h3>
            {hasLifeEvents && (
              <Bookmark className="h-3 w-3 text-secondary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Trend badge */}
            <span className={`inline-flex items-center gap-0.5 text-xs font-body font-bold px-1.5 py-0.5 rounded ${
              overallDelta > 0 ? 'bg-primary/10 text-primary' :
              overallDelta < 0 ? 'bg-destructive/10 text-destructive' :
              'bg-muted text-muted-foreground'
            }`}>
              {overallDelta > 0 ? <TrendingUp className="h-3 w-3" /> :
               overallDelta < 0 ? <TrendingDown className="h-3 w-3" /> :
               <Minus className="h-3 w-3" />}
              {overallDelta > 0 ? '+' : ''}{overallDelta}
            </span>
            {/* Current score */}
            <span className={`text-2xl font-heading font-bold ${
              latest.score >= 7 ? 'text-primary' :
              latest.score >= 4 ? 'text-muted-foreground' :
              'text-destructive'
            }`}>
              {latest.score}
            </span>
          </div>
        </div>

        {/* Heatmap strip */}
        <div className="flex gap-1">
          {monthData.map((m, i) => (
            <button
              key={i}
              onClick={() => setExpandedMonth(expandedMonth === i ? null : i)}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${m.month} '${m.year}: ${m.score}/10`}
            >
              <div className={`w-full h-6 sm:h-7 rounded-sm ${getHeatColor(m.score)} transition-all ${
                expandedMonth === i ? 'ring-2 ring-ring ring-offset-1' : 'group-hover:ring-1 group-hover:ring-ring/50'
              } flex items-center justify-center`}>
                <span className="text-[10px] font-heading font-bold text-white/90">{m.score}</span>
              </div>
              <span className="text-[9px] font-body text-muted-foreground leading-none">{m.month}</span>
            </button>
          ))}
        </div>

        {/* Expanded month detail */}
        {expandedMonth !== null && monthData[expandedMonth] && (
          <div className="mt-3 pt-3 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-heading font-bold">
                {monthData[expandedMonth].month} '{monthData[expandedMonth].year}
              </span>
              <span className="text-xs font-body text-muted-foreground">
                {getHeatLabel(monthData[expandedMonth].score)} · {monthData[expandedMonth].score}/10
                {monthData[expandedMonth].delta !== 0 && (
                  <span className={monthData[expandedMonth].delta > 0 ? 'text-primary' : 'text-destructive'}>
                    {' '}({monthData[expandedMonth].delta > 0 ? '+' : ''}{monthData[expandedMonth].delta} vs prev)
                  </span>
                )}
              </span>
            </div>
            {monthData[expandedMonth].spouseScore !== undefined && (
              <p className="text-xs font-body text-muted-foreground">
                Spouse rated: <span className="font-semibold">{monthData[expandedMonth].spouseScore}/10</span>
                {monthData[expandedMonth].spouseScore !== undefined && monthData[expandedMonth].score > 0 && (
                  <span className={Math.abs(monthData[expandedMonth].score - (monthData[expandedMonth].spouseScore ?? 0)) >= 2 ? ' text-destructive font-semibold' : ''}>
                    {' '}(gap: {monthData[expandedMonth].score - (monthData[expandedMonth].spouseScore ?? 0)})
                  </span>
                )}
              </p>
            )}
            {monthData[expandedMonth].lifeEvent && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                <p className="text-xs font-body text-foreground/80 italic">
                  "{monthData[expandedMonth].lifeEvent}"
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
