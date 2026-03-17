import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, ChevronLeft, ChevronRight, ClipboardCheck, Sparkles, ArrowRight } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReminders } from '@/hooks/use-reminders';
import { Checkbox } from '@/components/ui/checkbox';
import type { Snapshot, SnapshotCategory } from '@/types';

interface SnapshotPlaybackProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
  onNavigateToInsights?: () => void;
}

/** Short labels for long category names */
const LABEL_MAP: Record<string, string> = {
  'Parenting & Children': 'Parenting',
  'Progress with Major Goals & Objectives': 'Goal Progress',
  'Lessons from Scripture & Holy Spirit': 'Scripture Lessons',
  'Staff & Volunteers': 'Staff & Vol.',
  'Growth & Impact': 'Growth',
  'Life Lessons Learned': 'Life Lessons',
};

/** Custom tick that wraps text onto 2 lines for radar labels */
function WrappedTick({ x, y, payload, isMobile }: any) {
  const raw = payload?.value ?? '';
  const fontSize = isMobile ? 9 : 11;
  const maxWidth = isMobile ? 8 : 12;

  const words = raw.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (current.length + w.length + 1 > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  }
  if (current) lines.push(current);
  const finalLines = lines.slice(0, 2);

  return (
    <g transform={`translate(${x},${y})`}>
      {finalLines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={i * (fontSize + 2)}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontSize, fontFamily: 'Quicksand', fill: 'hsl(213, 20%, 40%)' }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** Generate a dynamic AI insight sentence from stats */
function generateInsight(stats: { strongest: { cat: SnapshotCategory; score: number }; weakest: { cat: SnapshotCategory; score: number }; biggestChange: { cat: SnapshotCategory; delta: number } | null; avg: number }): string {
  if (stats.biggestChange) {
    const { cat, delta } = stats.biggestChange;
    if (delta > 0) return `${cat.name} jumped +${delta} this month — your biggest improvement.`;
    if (delta < 0) return `${cat.name} dropped ${delta} this month. Worth a closer look.`;
  }
  if (stats.weakest.score <= 4) {
    return `${stats.weakest.cat.name} has been at ${stats.weakest.score} — ready to focus here?`;
  }
  if (stats.strongest.score >= 8) {
    return `${stats.strongest.cat.name} is a real strength at ${stats.strongest.score}. Keep leading there.`;
  }
  return `Your average is ${stats.avg.toFixed(1)}. Consistency builds momentum.`;
}

export function SnapshotPlayback({ snapshots, categories, onNavigateToInsights }: SnapshotPlaybackProps) {
  const isMobile = useIsMobile();
  const { getUpcoming, completeReminder } = useReminders();
  const chronological = useMemo(() => [...snapshots].reverse(), [snapshots]);
  const total = chronological.length;

  const [currentIdx, setCurrentIdx] = useState(total - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      setCurrentIdx(0);
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= total - 1) {
            setIsPlaying(false);
            return total - 1;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, total]);

  const handlePlay = useCallback(() => setIsPlaying(p => !p), []);
  const handleStep = useCallback((dir: -1 | 1) => {
    setIsPlaying(false);
    setCurrentIdx(prev => Math.max(0, Math.min(total - 1, prev + dir)));
  }, [total]);

  const currentSnap = chronological[currentIdx];
  const prevSnap = currentIdx > 0 ? chronological[currentIdx - 1] : null;

  const radarData = useMemo(() => {
    if (!currentSnap) return [];
    return categories.map(cat => {
      const r = currentSnap.ratings.find(r => r.categoryId === cat.id);
      return { category: LABEL_MAP[cat.name] || cat.name, score: r?.score ?? 5, fullMark: 10 };
    });
  }, [currentSnap, categories]);

  const ghostData = useMemo(() => {
    if (!prevSnap) return null;
    return categories.map(cat => {
      const r = prevSnap.ratings.find(r => r.categoryId === cat.id);
      return { category: LABEL_MAP[cat.name] || cat.name, ghost: r?.score ?? 5, fullMark: 10 };
    });
  }, [prevSnap, categories]);

  const mergedData = useMemo(() => {
    return radarData.map((d, i) => ({ ...d, ghost: ghostData?.[i]?.ghost ?? null }));
  }, [radarData, ghostData]);

  const stats = useMemo(() => {
    if (!currentSnap) return null;
    const scores = categories.map(cat => {
      const r = currentSnap.ratings.find(r => r.categoryId === cat.id);
      return { cat, score: r?.score ?? 5 };
    });
    const avg = scores.reduce((s, d) => s + d.score, 0) / scores.length;
    const strongest = [...scores].sort((a, b) => b.score - a.score)[0];
    const weakest = [...scores].sort((a, b) => a.score - b.score)[0];

    let biggestChange: { cat: SnapshotCategory; delta: number } | null = null;
    if (prevSnap) {
      let maxDelta = 0;
      categories.forEach(cat => {
        const curr = currentSnap.ratings.find(r => r.categoryId === cat.id)?.score ?? 5;
        const prev = prevSnap.ratings.find(r => r.categoryId === cat.id)?.score ?? 5;
        const d = Math.abs(curr - prev);
        if (d > maxDelta) { maxDelta = d; biggestChange = { cat, delta: curr - prev }; }
      });
    }
    return { avg, strongest, weakest, biggestChange };
  }, [currentSnap, prevSnap, categories]);

  const monthLabel = currentSnap
    ? new Date(currentSnap.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const shortMonth = currentSnap
    ? new Date(currentSnap.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const upcoming = getUpcoming(14).slice(0, 3);
  const insightText = stats ? generateInsight(stats) : '';

  if (total < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-2 sm:p-3 lg:p-3">
        {/* Main layout: side panels + radar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">

          {/* Left panel — Action Items (desktop only) */}
          {!isMobile && (
            <div className="hidden lg:flex flex-col w-44 shrink-0 justify-center">
              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-2">
                <div className="flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">Action Items</span>
                </div>
                {upcoming.length === 0 ? (
                  <p className="text-xs font-body text-muted-foreground/70 italic leading-snug">
                    You're on track. Keep going.
                  </p>
                ) : (
                  upcoming.map(item => (
                    <div key={item.id} className="flex items-start gap-2">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => completeReminder(item.id)}
                        className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      />
                      <p className={`text-xs font-body leading-snug truncate ${item.completed ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Radar chart */}
          <div className="flex-1 flex flex-col items-center relative">
            <div className={`w-full ${isMobile ? 'h-[260px]' : 'h-[480px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mergedData} cx="50%" cy="50%" outerRadius={isMobile ? '70%' : '88%'}>
                  <PolarGrid stroke="hsl(213, 15%, 82%)" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="category" tick={<WrappedTick isMobile={isMobile} />} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9, fontFamily: 'Quicksand' }} />
                  {ghostData && (
                    <Radar
                      name="Previous" dataKey="ghost"
                      stroke="hsl(213, 93%, 23%)" fill="hsl(213, 93%, 23%)"
                      fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="5 5"
                      isAnimationActive animationDuration={600}
                    />
                  )}
                  <Radar
                    name="Score" dataKey="score"
                    stroke="hsl(39, 78%, 48%)" fill="hsl(39, 78%, 48%)"
                    fillOpacity={0.25} strokeWidth={2.5}
                    isAnimationActive animationDuration={600}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Month overlay — appears during playback or navigation */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
              <span className="text-sm font-body font-medium text-muted-foreground/70 transition-all duration-300">
                {shortMonth}
              </span>
            </div>
          </div>

          {/* Right panel — AI Insight (desktop only) */}
          {!isMobile && (
            <div className="hidden lg:flex flex-col w-44 shrink-0 justify-center">
              <div className="p-3 rounded-lg border border-border/60 bg-card space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-xs font-body font-semibold uppercase tracking-wide text-muted-foreground">AI Insight</span>
                </div>
                <p className="text-xs font-body text-foreground leading-snug">
                  {insightText}
                </p>
                {onNavigateToInsights && (
                  <button
                    onClick={onNavigateToInsights}
                    className="flex items-center gap-1 text-xs font-body text-secondary hover:underline cursor-pointer min-h-[28px]"
                  >
                    Tell me about my chart <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile stat grid — 2 columns */}
        {isMobile && stats && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-center p-1.5 rounded-lg bg-muted/30">
              <p className="text-[9px] font-body text-muted-foreground uppercase">Strongest</p>
              <p className="text-sm font-heading font-bold text-primary">{stats.strongest.score}</p>
              <p className="text-[9px] font-body text-muted-foreground truncate">{stats.strongest.cat.name}</p>
            </div>
            <div className="text-center p-1.5 rounded-lg bg-muted/30">
              <p className="text-[9px] font-body text-muted-foreground uppercase">Needs Attention</p>
              <p className="text-sm font-heading font-bold text-destructive">{stats.weakest.score}</p>
              <p className="text-[9px] font-body text-muted-foreground truncate">{stats.weakest.cat.name}</p>
            </div>
          </div>
        )}

        {/* Playback controls — tight, quiet */}
        <div className="mt-1 space-y-1">
          {/* Timeline dots */}
          <div className="flex items-center gap-0.5 justify-center">
            {chronological.map((snap, i) => (
              <button
                key={snap.id}
                onClick={() => { setIsPlaying(false); setCurrentIdx(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIdx
                    ? 'h-2 w-2 bg-secondary shadow-sm'
                    : i < currentIdx
                    ? 'h-1.5 w-1.5 bg-secondary/40'
                    : 'h-1.5 w-1.5 bg-border'
                }`}
                aria-label={new Date(snap.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              />
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => handleStep(-1)}
              disabled={currentIdx <= 0}
              className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              onClick={handlePlay}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </button>

            <button
              onClick={() => handleStep(1)}
              disabled={currentIdx >= total - 1}
              className="h-7 w-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
