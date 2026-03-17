import { useMemo } from 'react';
import { CategorySparkline } from './CategorySparkline';
import { CATEGORY_COLORS } from './TrendChart';
import type { Snapshot, SnapshotCategory } from '@/types';

interface SparklineGridProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
}

/** Shorter display labels */
const LABEL_MAP: Record<string, string> = {
  'Marriage (You)': 'Marriage',
  'Marriage (Spouse)': 'Spouse View',
  'Parenting & Children (You)': 'Parenting',
  'Parenting & Children (Child)': 'Kids View',
  'Mental Health': 'Mental',
  'Physical Health': 'Physical',
  'Intimacy with Jesus': 'Faith',
  'Staff & Volunteers': 'Staff & Vol.',
  'Progress with Major Goals & Objectives': 'Goals',
  'Lessons from Scripture & Holy Spirit': 'Scripture',
  'Life Lessons Learned': 'Life Lessons',
  'Growth & Impact': 'Growth',
};

const GROUP_LABELS: Record<string, string> = {
  spiritual: 'Spiritual',
  personal: 'Personal',
  professional: 'Professional',
};

export function SparklineGrid({ snapshots, categories }: SparklineGridProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, SnapshotCategory[]> = {
      spiritual: [],
      personal: [],
      professional: [],
    };
    categories.forEach(cat => {
      if (groups[cat.group]) groups[cat.group].push(cat);
    });
    return groups;
  }, [categories]);

  // Get latest and first scores for delta
  const chrono = useMemo(() => [...snapshots].reverse(), [snapshots]);

  return (
    <div className="space-y-4">
      {(['spiritual', 'personal', 'professional'] as const).map(group => {
        const cats = grouped[group];
        if (cats.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">
              {GROUP_LABELS[group]}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {cats.map(cat => {
                const color = CATEGORY_COLORS[cat.id] || '#888';
                const label = LABEL_MAP[cat.name] || cat.name;

                // Get latest score
                const latestSnap = snapshots[0];
                const latestScore = latestSnap?.ratings.find(r => r.categoryId === cat.id)?.score ?? null;

                // Get first score for overall delta
                const firstSnap = chrono[0];
                const firstScore = firstSnap?.ratings.find(r => r.categoryId === cat.id)?.score ?? null;
                const delta = latestScore !== null && firstScore !== null ? latestScore - firstScore : null;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40 bg-card hover:border-border/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <p className="text-xs font-heading font-bold text-foreground truncate">{label}</p>
                      </div>
                      {latestScore !== null && (
                        <div className="flex items-center gap-1.5 mt-0.5 ml-3.5">
                          <span className="text-lg font-heading font-bold text-foreground">{latestScore}</span>
                          {delta !== null && delta !== 0 && (
                            <span className={`text-xs font-body font-bold ${delta > 0 ? 'text-primary' : 'text-destructive'}`}>
                              {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <CategorySparkline
                        categoryId={cat.id}
                        snapshots={snapshots}
                        width={120}
                        height={36}
                        color={color}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
