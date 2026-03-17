import { useMemo } from 'react';
import type { Snapshot } from '@/types';

interface CategorySparklineProps {
  categoryId: string;
  snapshots: Snapshot[];
  width?: number;
  height?: number;
  color?: string;
}

export function CategorySparkline({ categoryId, snapshots, width = 120, height = 36, color }: CategorySparklineProps) {
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

    // Smooth Catmull-Rom spline path
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(i - 1, 0)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(i + 2, coords.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const latest = scores[scores.length - 1];
    const trend = latest - scores[0];

    return { pathD, coords, trend, latest };
  }, [categoryId, snapshots, width, height]);

  if (!points) return null;

  const strokeColor = color || (points.trend >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))');

  return (
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
  );
}
