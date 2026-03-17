import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Snapshot, SnapshotCategory } from '@/types';

interface SnapshotPlaybackProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
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

  // Split into up to 2 lines
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

export function SnapshotPlayback({ snapshots, categories }: SnapshotPlaybackProps) {
  const isMobile = useIsMobile();
  // snapshots are newest-first, reverse for chronological playback
  const chronological = useMemo(() => [...snapshots].reverse(), [snapshots]);
  const total = chronological.length;

  const [currentIdx, setCurrentIdx] = useState(total - 1); // start at newest
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play: start from oldest, move forward
  useEffect(() => {
    if (isPlaying) {
      setCurrentIdx(0); // start from oldest
      intervalRef.current = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= total - 1) {
            setIsPlaying(false);
            return total - 1;
          }
          return prev + 1;
        });
      }, 2000 / speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed, total]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleStep = useCallback((dir: -1 | 1) => {
    setIsPlaying(false);
    setCurrentIdx(prev => Math.max(0, Math.min(total - 1, prev + dir)));
  }, [total]);

  const currentSnap = chronological[currentIdx];
  const prevSnap = currentIdx > 0 ? chronological[currentIdx - 1] : null;

  // Build radar data with full labels
  const radarData = useMemo(() => {
    if (!currentSnap) return [];
    return categories.map(cat => {
      const r = currentSnap.ratings.find(r => r.categoryId === cat.id);
      const label = LABEL_MAP[cat.name] || cat.name;
      return {
        category: label,
        score: r?.score ?? 5,
        fullMark: 10,
      };
    });
  }, [currentSnap, categories]);

  // Ghost (previous month) data
  const ghostData = useMemo(() => {
    if (!prevSnap) return null;
    return categories.map(cat => {
      const r = prevSnap.ratings.find(r => r.categoryId === cat.id);
      return {
        category: LABEL_MAP[cat.name] || cat.name,
        ghost: r?.score ?? 5,
        fullMark: 10,
      };
    });
  }, [prevSnap, categories]);

  // Merge ghost + current into one dataset
  const mergedData = useMemo(() => {
    return radarData.map((d, i) => ({
      ...d,
      ghost: ghostData?.[i]?.ghost ?? null,
    }));
  }, [radarData, ghostData]);

  // Stats
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
        if (d > maxDelta) {
          maxDelta = d;
          biggestChange = { cat, delta: curr - prev };
        }
      });
    }

    return { avg, strongest, weakest, biggestChange };
  }, [currentSnap, prevSnap, categories]);

  const monthLabel = currentSnap
    ? new Date(currentSnap.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const isAtEnd = currentIdx === total - 1;

  if (total < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-3 sm:p-4 lg:p-5">
        {/* Title */}
        <div className="text-center mb-2 sm:mb-3">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-primary">Your Year in Motion</h2>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Watch how your priorities have shifted over the last {total} months
          </p>
        </div>

        {/* Main layout: radar + stat cards */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4">
          {/* Left stat cards — desktop only */}
          {!isMobile && stats && (
            <div className="hidden lg:flex flex-col gap-3 w-48 shrink-0 pt-12">
              <StatMini
                icon={<TrendingUp className="h-4 w-4 text-primary" />}
                label="Strongest"
                value={stats.strongest.cat.name}
                score={stats.strongest.score}
                scoreColor="text-primary"
              />
              <StatMini
                icon={<TrendingDown className="h-4 w-4 text-destructive" />}
                label="Needs Attention"
                value={stats.weakest.cat.name}
                score={stats.weakest.score}
                scoreColor="text-destructive"
              />
            </div>
          )}

          {/* Radar chart */}
          <div className="flex-1 flex flex-col items-center">
            <div className={`w-full ${isMobile ? 'h-[280px]' : 'h-[340px] lg:h-[380px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mergedData} cx="50%" cy="50%" outerRadius={isMobile ? '70%' : '76%'}>
                  <PolarGrid stroke="hsl(213, 15%, 82%)" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={<WrappedTick isMobile={isMobile} />}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 9, fontFamily: 'Quicksand' }} />
                  {/* Ghost — previous month */}
                  {ghostData && (
                    <Radar
                      name="Previous"
                      dataKey="ghost"
                      stroke="hsl(213, 93%, 23%)"
                      fill="hsl(213, 93%, 23%)"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  )}
                  {/* Current month */}
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(39, 78%, 48%)"
                    fill="hsl(39, 78%, 48%)"
                    fillOpacity={0.25}
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* "You are here" badge */}
            {isAtEnd && !isPlaying && (
              <Badge className="bg-secondary/15 text-secondary border-secondary/30 font-body text-xs -mt-2 mb-2">
                ✦ You are here — {monthLabel}
              </Badge>
            )}
          </div>

          {/* Right stat card — desktop only */}
          {!isMobile && stats?.biggestChange && (
            <div className="hidden lg:flex flex-col gap-3 w-48 shrink-0 pt-12">
              <StatMini
                icon={<Zap className="h-4 w-4 text-secondary" />}
                label="Biggest Change"
                value={stats.biggestChange.cat.name}
                score={stats.biggestChange.delta}
                scoreColor={stats.biggestChange.delta > 0 ? 'text-primary' : 'text-destructive'}
                showDelta
              />
              <div className="text-center mt-2 p-3 rounded-lg bg-muted/40">
                <p className="text-3xl font-heading font-bold text-secondary">{stats.avg.toFixed(1)}</p>
                <p className="text-xs font-body text-muted-foreground mt-0.5">Month Average</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile stat cards */}
        {isMobile && stats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs font-body text-muted-foreground">Strongest</p>
              <p className="text-sm font-heading font-bold text-primary truncate">{stats.strongest.score}</p>
              <p className="text-[10px] font-body text-muted-foreground truncate">{stats.strongest.cat.name}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs font-body text-muted-foreground">Average</p>
              <p className="text-sm font-heading font-bold text-secondary">{stats.avg.toFixed(1)}</p>
              <p className="text-[10px] font-body text-muted-foreground">{monthLabel.split(' ')[0]}</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <p className="text-xs font-body text-muted-foreground">Weakest</p>
              <p className="text-sm font-heading font-bold text-destructive truncate">{stats.weakest.score}</p>
              <p className="text-[10px] font-body text-muted-foreground truncate">{stats.weakest.cat.name}</p>
            </div>
          </div>
        )}

        {/* Playback controls */}
        <div className="mt-1 space-y-1">
          {/* Timeline dots — smaller and tighter */}
          <div className="flex items-center gap-0.5 justify-center">
            {chronological.map((snap, i) => (
              <button
                key={snap.id}
                onClick={() => { setIsPlaying(false); setCurrentIdx(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIdx
                    ? 'h-2.5 w-2.5 bg-secondary shadow-sm'
                    : i < currentIdx
                    ? 'h-1.5 w-1.5 bg-secondary/40'
                    : 'h-1.5 w-1.5 bg-border'
                }`}
                aria-label={new Date(snap.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              />
            ))}
          </div>

          {/* Controls row — compact */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost" size="icon"
              onClick={() => handleStep(-1)}
              disabled={currentIdx <= 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePlay}
              className="font-body text-xs gap-1.5 min-h-[36px] px-4 border-secondary/30 hover:bg-secondary/10"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              variant="ghost" size="icon"
              onClick={() => handleStep(1)}
              disabled={currentIdx >= total - 1}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month label + speed — single compact line */}
          <div className="flex items-center justify-center gap-3">
            <p className="text-xs font-heading font-bold text-foreground">{monthLabel}</p>
            <span className="text-[10px] text-muted-foreground">·</span>
            <p className="text-xs font-body text-muted-foreground">Avg: {stats?.avg.toFixed(1)}</p>
            {!isMobile && (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <button
                  onClick={() => setSpeed(s => s === 1 ? 2 : 1)}
                  className="text-[11px] font-body text-secondary hover:text-secondary/80 font-semibold min-h-[28px]"
                >
                  {speed}x speed
                </button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatMini({ icon, label, value, score, scoreColor, showDelta }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  score: number;
  scoreColor: string;
  showDelta?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border border-border/60 bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs font-body text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-heading font-bold truncate">{value}</p>
      <p className={`text-xl font-heading font-bold ${scoreColor}`}>
        {showDelta && score > 0 ? '+' : ''}{score}
      </p>
    </div>
  );
}
