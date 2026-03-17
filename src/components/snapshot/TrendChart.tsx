import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { SparklineGrid } from './SparklineGrid';
import type { Snapshot, SnapshotCategory } from '@/types';

interface TrendChartProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  // Spiritual (2)
  intimacyWithJesus: '#D4981B',
  lessonsScripture: '#C4722B',
  // Personal (5)
  marriageSelf: '#1B3A6B',
  marriageSpouse: '#2D8B8B',
  parentingSelf: '#5B7B9B',
  parentingChild: '#5B5BAB',
  mentalHealth: '#7B5B9B',
  physicalHealth: '#5B7B9B',
  // Professional (6)
  staff: '#2D8B5B',
  sales: '#3B8BC4',
  marketing: '#C49B2D',
  operations: '#C45B6B',
  finances: '#8B5BC4',
  leadership: '#2DABB9',
  // Extras for other snapshot types
  teamManagement: '#3B8BC4',
  progressGoals: '#8B5BC4',
  mentoring: '#C4722B',
  lifeLessons: '#D4981B',
};

/** Shorter display labels for long category names */
const LABEL_MAP: Record<string, string> = {
  'Marriage (You)': 'Marriage',
  'Marriage (Spouse)': 'Spouse View',
  'Parenting & Children (You)': 'Parenting',
  'Parenting & Children (Child)': 'Kids View',
  'Mental Health': 'Mental',
  'Physical Health': 'Physical',
  'Intimacy with Jesus': 'Faith',
  'Staff & Volunteers': 'Staff & Vol.',
  'Progress with Major Goals & Objectives': 'Goal Progress',
  'Lessons from Scripture & Holy Spirit': 'Scripture',
  'Life Lessons Learned': 'Life Lessons',
  'Growth & Impact': 'Growth',
};

type GroupFilter = 'personal' | 'professional' | 'spiritual' | 'all';

/** Custom tooltip showing score + delta */
function TrendTooltip({ active, payload, label, categories, prevData }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-[220px]">
      <p className="text-xs font-heading font-bold text-foreground mb-1.5">{label}</p>
      {payload
        .filter((p: any) => p.dataKey !== '_average')
        .map((p: any) => {
          const cat = categories?.find((c: SnapshotCategory) => c.id === p.dataKey);
          const name = cat ? (LABEL_MAP[cat.name] || cat.name) : p.dataKey;
          const prev = prevData?.[p.dataKey];
          const delta = prev != null && p.value != null ? p.value - prev : null;
          return (
            <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.stroke }} />
                <span className="text-xs font-body text-foreground/80 truncate">{name}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-heading font-bold">{p.value}</span>
                {delta !== null && delta !== 0 && (
                  <span className={`text-[10px] font-body font-bold ${delta > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {delta > 0 ? '↑' : '↓'}{Math.abs(delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export function TrendChart({ snapshots, categories }: TrendChartProps) {
  const isMobile = useIsMobile();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('personal');

  const chronological = useMemo(() => [...snapshots].reverse(), [snapshots]);

  const chartData = useMemo(() => {
    return chronological.map((s, idx) => {
      const row: Record<string, any> = {
        month: new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        _idx: idx,
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

  // Build prev-month lookup for delta in tooltip
  const prevDataMap = useMemo(() => {
    const map: Record<number, Record<string, number | null>> = {};
    chartData.forEach((row, idx) => {
      if (idx === 0) { map[idx] = {}; return; }
      const prev: Record<string, number | null> = {};
      categories.forEach(cat => { prev[cat.id] = chartData[idx - 1][cat.id] ?? null; });
      map[idx] = prev;
    });
    return map;
  }, [chartData, categories]);

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

        {/* Group tabs */}
        <Tabs value={groupFilter} onValueChange={(v) => { setGroupFilter(v as GroupFilter); setHighlighted(null); }} className="mb-4">
          <TabsList className="p-1 gap-0 font-body w-full flex">
            <TabsTrigger value="personal" className="flex-1 font-body font-semibold text-xs sm:text-sm px-2 py-2 min-h-[36px]">
              Personal
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex-1 font-body font-semibold text-xs sm:text-sm px-2 py-2 min-h-[36px]">
              Professional
            </TabsTrigger>
            <TabsTrigger value="spiritual" className="flex-1 font-body font-semibold text-xs sm:text-sm px-2 py-2 min-h-[36px]">
              Spiritual
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 font-body font-semibold text-xs sm:text-sm px-2 py-2 min-h-[36px]">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* "All" tab → sparkline grid instead of messy 13-line chart */}
        {groupFilter === 'all' ? (
          <SparklineGrid snapshots={snapshots} categories={categories} />
        ) : (
          <>
            {/* Category legend pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {filteredCategories.map(cat => {
                const color = CATEGORY_COLORS[cat.id] || '#888';
                const isActive = !highlighted || highlighted === cat.id;
                const label = LABEL_MAP[cat.name] || cat.name;
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
                    {label}
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
                    content={
                      <TrendTooltip
                        categories={filteredCategories}
                        prevData={null}
                      />
                    }
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
