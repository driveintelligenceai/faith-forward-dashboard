import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, BarChart3, BookOpen, AlertTriangle } from 'lucide-react';
import type { Snapshot, SnapshotCategory } from '@/types';

interface SnapshotSummaryProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
}

export function SnapshotSummary({ snapshots, categories }: SnapshotSummaryProps) {
  const chronological = useMemo(() => [...snapshots].reverse(), [snapshots]);
  const total = chronological.length;

  const analysis = useMemo(() => {
    if (total < 2) return null;

    const latest = chronological[total - 1];
    const previous = chronological[total - 2];
    const oldest = chronological[0];

    // Current averages
    const currentScores = categories.map(cat => {
      const r = latest.ratings.find(r => r.categoryId === cat.id);
      return r?.score ?? 5;
    });
    const currentAvg = currentScores.reduce((a, b) => a + b, 0) / currentScores.length;

    // Previous month avg
    const prevScores = categories.map(cat => {
      const r = previous.ratings.find(r => r.categoryId === cat.id);
      return r?.score ?? 5;
    });
    const prevAvg = prevScores.reduce((a, b) => a + b, 0) / prevScores.length;

    // Oldest avg
    const oldestScores = categories.map(cat => {
      const r = oldest.ratings.find(r => r.categoryId === cat.id);
      return r?.score ?? 5;
    });
    const oldestAvg = oldestScores.reduce((a, b) => a + b, 0) / oldestScores.length;

    // Percentile: how many months had lower average
    const monthlyAvgs = chronological.map(snap => {
      const scores = categories.map(c => snap.ratings.find(r => r.categoryId === c.id)?.score ?? 5);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
    const lowerCount = monthlyAvgs.filter(a => a < currentAvg).length;
    const percentile = Math.round((lowerCount / total) * 100);

    // 12-month averages per category
    const catAverages = categories.map(cat => {
      const scores = chronological
        .map(s => s.ratings.find(r => r.categoryId === cat.id)?.score)
        .filter((s): s is number => s !== undefined);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
      return { cat, avg };
    });

    const strongest12 = [...catAverages].sort((a, b) => b.avg - a.avg)[0];
    const weakest12 = [...catAverages].sort((a, b) => a.avg - b.avg)[0];

    // Most improved / declined (delta from oldest to newest)
    const catDeltas = categories.map(cat => {
      const oldScore = oldest.ratings.find(r => r.categoryId === cat.id)?.score ?? 5;
      const newScore = latest.ratings.find(r => r.categoryId === cat.id)?.score ?? 5;
      return { cat, delta: newScore - oldScore };
    });
    const mostImproved = [...catDeltas].sort((a, b) => b.delta - a.delta)[0];
    const mostDeclined = [...catDeltas].sort((a, b) => a.delta - b.delta)[0];

    // Most volatile (std dev)
    const catVolatility = categories.map(cat => {
      const scores = chronological
        .map(s => s.ratings.find(r => r.categoryId === cat.id)?.score)
        .filter((s): s is number => s !== undefined);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / scores.length;
      return { cat, stdDev: Math.sqrt(variance) };
    });
    const mostVolatile = [...catVolatility].sort((a, b) => b.stdDev - a.stdDev)[0];

    // Generate algorithmic insights
    const stories: string[] = [];

    // Insight: strong vs weak correlation
    if (strongest12 && weakest12 && strongest12.avg - weakest12.avg >= 3) {
      stories.push(
        `You invest heavily in **${strongest12.cat.name}** (avg ${strongest12.avg.toFixed(1)}) but **${weakest12.cat.name}** lags behind at ${weakest12.avg.toFixed(1)}. Consider if these are connected — strength in one area shouldn't come at the cost of another.`
      );
    }

    // Insight: declining categories
    const decliningCats = catDeltas.filter(d => d.delta <= -2);
    if (decliningCats.length > 0) {
      const names = decliningCats.map(d => `**${d.cat.name}**`).join(' and ');
      stories.push(
        `${names} ${decliningCats.length === 1 ? 'has' : 'have'} declined significantly over ${total} months. This isn't a blip — it's a pattern worth addressing with your Forum brothers.`
      );
    }

    // Insight: spouse perception gap
    const marriageRatings = chronological.map(s => {
      const selfR = s.ratings.find(r => r.categoryId === 'marriageSelf');
      const spouseR = s.ratings.find(r => r.categoryId === 'marriageSpouse');
      return { self: selfR?.score ?? null, spouse: spouseR?.score ?? null };
    }).filter(r => r.self !== null && r.spouse !== null);
    if (marriageRatings.length >= 3) {
      const avgGap = marriageRatings.reduce((s, r) => s + ((r.self ?? 0) - (r.spouse ?? 0)), 0) / marriageRatings.length;
      if (avgGap >= 1.5) {
        stories.push(
          `Your spouse consistently scores your marriage **${avgGap.toFixed(1)} points lower** than you do. That perception gap is worth a real conversation — not about being right, but about truly hearing her.`
        );
      }
    }

    // Insight: health decline
    const healthCat = categories.find(c => c.id === 'physicalHealth');
    if (healthCat) {
      const healthScores = chronological.map(s => s.ratings.find(r => r.categoryId === 'physicalHealth')?.score ?? 5);
      const recentLow = healthScores.slice(-3).some(s => s <= 4);
      if (recentLow) {
        stories.push(
          `**Physical Health** has dropped below 5 recently. Your body is sending a message. The men who thrive long-term prioritize health not for vanity — but for the decades ahead with their family.`
        );
      }
    }

    // Fallback
    if (stories.length === 0) {
      stories.push(`Over ${total} months, your overall average has moved from ${oldestAvg.toFixed(1)} to ${currentAvg.toFixed(1)}. Keep showing up with honesty — that's where real growth starts.`);
    }

    const oldestLabel = new Date(oldest.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return {
      currentAvg,
      deltaFromPrev: currentAvg - prevAvg,
      deltaFromOldest: currentAvg - oldestAvg,
      oldestLabel,
      percentile,
      strongest12,
      weakest12,
      mostImproved,
      mostDeclined,
      mostVolatile,
      stories,
    };
  }, [chronological, categories, total]);

  if (!analysis || total < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary mb-4 sm:mb-6">Where You Stand</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Column 1: Right Now */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">Right Now</h3>
            </div>
            <div className="text-center p-4 rounded-xl bg-secondary/5 border border-secondary/20">
              <p className="text-5xl font-heading font-bold text-secondary">{analysis.currentAvg.toFixed(1)}</p>
              <p className="text-xs font-body text-muted-foreground mt-1">Overall Average</p>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">vs last month</span>
              <span className={`font-bold ${analysis.deltaFromPrev >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {analysis.deltaFromPrev >= 0 ? '↑' : '↓'} {Math.abs(analysis.deltaFromPrev).toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-muted-foreground">vs {analysis.oldestLabel}</span>
              <span className={`font-bold ${analysis.deltaFromOldest >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {analysis.deltaFromOldest >= 0 ? '+' : ''}{analysis.deltaFromOldest.toFixed(1)}
              </span>
            </div>
            <p className="text-xs font-body text-muted-foreground italic">
              You're scoring higher than {analysis.percentile}% of your history.
            </p>
          </div>

          {/* Column 2: Your Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">Your Patterns</h3>
            </div>
            <PatternRow
              label="Strongest (12mo avg)"
              value={analysis.strongest12.cat.name}
              score={analysis.strongest12.avg.toFixed(1)}
              color="text-primary"
            />
            <PatternRow
              label="Weakest (12mo avg)"
              value={analysis.weakest12.cat.name}
              score={analysis.weakest12.avg.toFixed(1)}
              color="text-destructive"
            />
            <PatternRow
              label="Most improved"
              value={analysis.mostImproved.cat.name}
              score={`${analysis.mostImproved.delta > 0 ? '+' : ''}${analysis.mostImproved.delta}`}
              color={analysis.mostImproved.delta >= 0 ? 'text-primary' : 'text-destructive'}
            />
            <PatternRow
              label="Most declined"
              value={analysis.mostDeclined.cat.name}
              score={`${analysis.mostDeclined.delta > 0 ? '+' : ''}${analysis.mostDeclined.delta}`}
              color="text-destructive"
            />
            <PatternRow
              label="Most volatile"
              value={analysis.mostVolatile.cat.name}
              score={`σ ${analysis.mostVolatile.stdDev.toFixed(1)}`}
              color="text-muted-foreground"
            />
          </div>

          {/* Column 3: The Story */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">The Story</h3>
            </div>
            <div className="space-y-3">
              {analysis.stories.map((story, i) => (
                <div key={i} className="flex gap-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-secondary shrink-0 mt-1" />
                  <p className="text-sm font-body text-foreground/85 leading-relaxed [&_strong]:text-foreground [&_strong]:font-bold"
                     dangerouslySetInnerHTML={{ __html: story.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PatternRow({ label, value, score, color }: { label: string; value: string; score: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-body text-muted-foreground">{label}</p>
        <p className="text-sm font-heading font-bold truncate">{value}</p>
      </div>
      <span className={`text-lg font-heading font-bold ${color} shrink-0 ml-2`}>{score}</span>
    </div>
  );
}
