import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import type { Snapshot } from '@/types';

interface PulseAlert {
  emoji: string;
  headline: string;
  detail: string;
  type: 'declining' | 'stagnant' | 'growing' | 'warning';
}

function generateAlerts(snapshots: Snapshot[]): PulseAlert[] {
  if (snapshots.length < 3) return [];

  const alerts: PulseAlert[] = [];
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const recent3 = sorted.slice(-3);
  const catMap = new Map(SNAPSHOT_CATEGORIES.map(c => [c.id, c.name]));

  // Per-category analysis
  const categoryIds = new Set(sorted[0]?.ratings.map(r => r.categoryId) || []);

  for (const catId of categoryIds) {
    const last3Scores = recent3.map(s => s.ratings.find(r => r.categoryId === catId)?.score ?? 0);
    const catName = catMap.get(catId) || catId;

    // 3-month declining trend
    if (last3Scores[0] > last3Scores[1] && last3Scores[1] > last3Scores[2]) {
      alerts.push({
        emoji: '📉',
        headline: `${catName} has declined 3 months straight`,
        detail: `You scored ${last3Scores.join('→')}. Time to address this before it becomes a pattern.`,
        type: 'declining',
      });
    }

    // Stagnant at low score (≤4 for 3+ months)
    if (last3Scores.every(s => s <= 4)) {
      // Don't double-count if already declining
      if (!(last3Scores[0] > last3Scores[1] && last3Scores[1] > last3Scores[2])) {
        alerts.push({
          emoji: '⚠️',
          headline: `${catName} has been stuck at ${last3Scores[2]}`,
          detail: `It's been at ${last3Scores.join(', ')} for three months. Small steps compound.`,
          type: 'stagnant',
        });
      }
    }

    // Spouse perception gap
    const latestSnap = sorted[sorted.length - 1];
    const latestRating = latestSnap.ratings.find(r => r.categoryId === catId);
    if (latestRating?.spouseScore !== undefined && latestRating.spouseScore > 0) {
      const gap = latestRating.score - latestRating.spouseScore;
      if (gap >= 2) {
        alerts.push({
          emoji: '💬',
          headline: `Your wife sees ${catName} differently`,
          detail: `You scored ${latestRating.score}, she scored ${latestRating.spouseScore}. That gap matters.`,
          type: 'warning',
        });
      }
    }
  }

  // Find biggest positive trend (last 6 months)
  const recent6 = sorted.slice(-6);
  if (recent6.length >= 2) {
    let bestDelta = 0;
    let bestCat = '';
    for (const catId of categoryIds) {
      const first = recent6[0].ratings.find(r => r.categoryId === catId)?.score ?? 0;
      const last = recent6[recent6.length - 1].ratings.find(r => r.categoryId === catId)?.score ?? 0;
      if (last - first > bestDelta) {
        bestDelta = last - first;
        bestCat = catMap.get(catId) || catId;
      }
    }
    if (bestDelta >= 2) {
      alerts.push({
        emoji: '📈',
        headline: `${bestCat} is your growth story`,
        detail: `Up ${bestDelta} points over 6 months. Whatever you're doing, keep doing it.`,
        type: 'growing',
      });
    }
  }

  // Prioritize: declining first, then warning, stagnant, growing. Limit to 3.
  const priority: Record<string, number> = { declining: 0, warning: 1, stagnant: 2, growing: 3 };
  alerts.sort((a, b) => priority[a.type] - priority[b.type]);
  return alerts.slice(0, 3);
}

const borderColors: Record<string, string> = {
  declining: 'border-l-destructive',
  stagnant: 'border-l-secondary',
  growing: 'border-l-primary',
  warning: 'border-l-secondary',
};

const bgColors: Record<string, string> = {
  declining: 'bg-destructive/5',
  stagnant: 'bg-secondary/5',
  growing: 'bg-primary/5',
  warning: 'bg-secondary/5',
};

export function PulseAlerts({ snapshots }: { snapshots: Snapshot[] }) {
  const alerts = generateAlerts(snapshots);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">Pulse</h2>
        <p className="text-sm font-body text-muted-foreground">Patterns the AI noticed in your journey</p>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`border-l-4 ${borderColors[alert.type]} ${bgColors[alert.type]} rounded-r-xl p-4 sm:p-5 transition-all`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none shrink-0 mt-0.5">{alert.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug">
                  {alert.headline}
                </p>
                <p className="font-body text-sm text-muted-foreground mt-1 leading-relaxed">
                  {alert.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
