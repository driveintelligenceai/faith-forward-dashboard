import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Snapshot, SnapshotCategory } from '@/types';

interface TrendChartProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
}

const CATEGORY_COLORS: Record<string, string> = {
  intimacy: '#043370',
  marriage: '#dc981b',
  parenting: '#22C55E',
  staff: '#3B82F6',
  sales: '#8B5CF6',
  marketing: '#EF4444',
  operations: '#06B6D4',
  finances: '#F59E0B',
  leadership: '#EC4899',
  mental_health: '#14B8A6',
  physical_health: '#6366F1',
  // Extras for other snapshot types
  team_management: '#3B82F6',
  major_goals: '#8B5CF6',
  scripture_lessons: '#F59E0B',
  mentoring: '#06B6D4',
  life_lessons: '#EC4899',
  staff_volunteers: '#3B82F6',
  growth_impact: '#22C55E',
};

type GroupFilter = 'all' | 'personal' | 'professional' | 'spiritual';

export function TrendChart({ snapshots, categories }: TrendChartProps) {
  const isMobile = useIsMobile();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');

  const chronological = useMemo(() => [...snapshots].reverse(), [snapshots]);

  const chartData = useMemo(() => {
    return chronological.map(s => {
      const row: Record<string, any> = {
        month: new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      };
      let sum = 0;
      let count = 0;
      categories.forEach(cat => {
        const r = s.ratings.find(r => r.categoryId === cat.id);
        const score = r?.score ?? null;
        row[cat.id] = score;
        if (score !== null) { sum += score; count++; }
      });
      row['_average'] = count > 0 ? Math.round((sum / count) * 10) / 10 : null;
      return row;
    });
  }, [chronological, categories]);

  const filteredCategories = useMemo(() => {
    if (groupFilter === 'all') return categories;
    return categories.filter(c => c.group === groupFilter);
  }, [categories, groupFilter]);

  const toggleHighlight = (catId: string) => {
    setHighlighted(prev => prev === catId ? null : catId);
  };

  if (chartData.length < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-3 sm:p-4 lg:p-5">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">Category Trends</h2>
          <p className="text-sm font-body text-muted-foreground mt-1">
            12-month view — tap a category to highlight
          </p>
        </div>

        {/* Group filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(['all', 'spiritual', 'personal', 'professional'] as GroupFilter[]).map(g => (
            <Button
              key={g}
              variant={groupFilter === g ? 'default' : 'outline'}
              size="sm"
              className={`font-body text-xs min-h-[36px] capitalize ${
                groupFilter === g ? 'bg-primary text-primary-foreground' : 'border-border/60'
              }`}
              onClick={() => { setGroupFilter(g); setHighlighted(null); }}
            >
              {g === 'all' ? 'All Categories' : g}
            </Button>
          ))}
        </div>

        {/* Category legend pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {filteredCategories.map(cat => {
            const color = CATEGORY_COLORS[cat.id] || '#888';
            const isActive = !highlighted || highlighted === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => toggleHighlight(cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body font-semibold transition-all duration-200 min-h-[30px] ${
                  isActive ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  backgroundColor: `${color}15`,
                  color: color,
                  border: `1px solid ${color}40`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className={`w-full ${isMobile ? 'h-[220px]' : 'h-[300px] lg:h-[320px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'Quicksand' }}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fontFamily: 'Quicksand' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontFamily: 'Quicksand',
                  fontSize: '12px',
                }}
                formatter={(value: any, name: string) => {
                  if (name === '_average') return [value, 'Overall Average'];
                  const cat = categories.find(c => c.id === name);
                  return [value, cat?.name || name];
                }}
              />
              {/* Average reference line */}
              <Line
                type="monotone"
                dataKey="_average"
                name="_average"
                stroke="#000"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                opacity={highlighted ? 0.15 : 0.4}
              />
              {/* Category lines */}
              {filteredCategories.map(cat => {
                const color = CATEGORY_COLORS[cat.id] || '#888';
                const isHighlighted = highlighted === cat.id;
                const opacity = !highlighted ? 1 : isHighlighted ? 1 : 0.12;
                const width = isHighlighted ? 3 : 2;
                return (
                  <Line
                    key={cat.id}
                    type="monotone"
                    dataKey={cat.id}
                    name={cat.id}
                    stroke={color}
                    strokeWidth={width}
                    dot={{ r: isHighlighted ? 4 : 2.5, strokeWidth: 0, fill: color }}
                    activeDot={{ r: 5 }}
                    connectNulls
                    opacity={opacity}
                    isAnimationActive={true}
                    animationDuration={400}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
