import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Snapshot, SnapshotCategory } from '@/types';

interface TrendLineChartProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
}

const GROUP_COLORS: Record<string, string[]> = {
  spiritual: ['hsl(39, 78%, 48%)', 'hsl(39, 78%, 62%)'],
  personal: ['hsl(213, 40%, 35%)', 'hsl(213, 40%, 50%)', 'hsl(213, 40%, 65%)', 'hsl(213, 40%, 75%)'],
  professional: ['hsl(150, 40%, 40%)', 'hsl(150, 40%, 50%)', 'hsl(180, 30%, 45%)', 'hsl(200, 35%, 50%)', 'hsl(220, 35%, 55%)', 'hsl(250, 30%, 55%)'],
};

export function TrendLineChart({ snapshots, categories }: TrendLineChartProps) {
  const chartData = useMemo(() => {
    const chronological = [...snapshots].reverse();
    return chronological.map(s => {
      const row: Record<string, any> = {
        month: new Date(s.date).toLocaleDateString('en-US', { month: 'short' }),
      };
      categories.forEach(cat => {
        const r = s.ratings.find(r => r.categoryId === cat.id);
        row[cat.id] = r?.score ?? null;
      });
      return row;
    });
  }, [snapshots, categories]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const groupCounters: Record<string, number> = {};
    categories.forEach(cat => {
      const colors = GROUP_COLORS[cat.group] || GROUP_COLORS.professional;
      const idx = groupCounters[cat.group] || 0;
      map[cat.id] = colors[idx % colors.length];
      groupCounters[cat.group] = idx + 1;
    });
    return map;
  }, [categories]);

  if (chartData.length < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-3">
          <p className="text-lg font-heading font-bold text-foreground">All Categories — 12 Month Trends</p>
          <p className="text-xs font-body text-muted-foreground">See where each area of your life is heading at a glance.</p>
        </div>
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Quicksand' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'Quicksand' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontFamily: 'Quicksand',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'Quicksand' }}
                iconType="circle"
                iconSize={8}
              />
              {categories.map(cat => (
                <Line
                  key={cat.id}
                  type="monotone"
                  dataKey={cat.id}
                  name={cat.name}
                  stroke={colorMap[cat.id]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
