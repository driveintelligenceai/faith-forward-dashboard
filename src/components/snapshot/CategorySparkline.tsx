import { useMemo } from 'react';
import type { Snapshot } from '@/types';

interface CategorySparklineProps {
  categoryId: string;
  snapshots: Snapshot[];
  width?: number;
  height?: number;
}

export function CategorySparkline({ categoryId, snapshots, width = 100, height = 32 }: CategorySparklineProps) {
  const points = useMemo(() => {
    // Get last 6 snapshots, reversed to chronological
    const recent = snapshots.slice(0, 6).reverse();
    if (recent.length < 2) return null;

    const scores = recent.map((s) => {
      const r = s.ratings.find((r) => r.categoryId === categoryId);
      return r?.score ?? null;
    }).filter((s): s is number => s !== null);

    if (scores.length < 2) return null;

    const padding = 4;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    const coords = scores.map((score, i) => ({
      x: padding + (i / (scores.length - 1)) * usableW,
      y: padding + ((10 - score) / 10) * usableH,
    }));

    const pathD = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const latest = scores[scores.length - 1];
    const trend = latest - scores[0];

    return { pathD, coords, trend, latest };
  }, [categoryId, snapshots, width, height]);

  if (!points) return null;

  const strokeColor = points.trend >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';

  return (
    <div className="flex items-center gap-1.5">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={points.pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
        {/* Latest point dot */}
        <circle
          cx={points.coords[points.coords.length - 1].x}
          cy={points.coords[points.coords.length - 1].y}
          r={3}
          fill={strokeColor}
        />
      </svg>
      <span className={`text-xs font-body font-bold ${points.trend > 0 ? 'text-score-high' : points.trend < 0 ? 'text-score-low' : 'text-muted-foreground'}`}>
        {points.trend > 0 ? '↑' : points.trend < 0 ? '↓' : '—'}{Math.abs(points.trend)}
      </span>
    </div>
  );
}
