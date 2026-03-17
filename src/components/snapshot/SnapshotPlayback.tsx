import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const fontSize = isMobile ? 9 : 13;
  const maxWidth = isMobile ? 8 : 14;

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

  const monthLabel = currentSnap
    ? new Date(currentSnap.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const shortMonth = currentSnap
    ? new Date(currentSnap.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  if (total < 2) return null;

  return (
    <Card className="border-secondary/20">
      <CardContent className="p-2 sm:p-3 lg:p-4">
        {/* Radar chart — enlarged, no side panels */}
        <div className="flex flex-col items-center relative">
          <div className={`w-full ${isMobile ? 'h-[280px]' : 'h-[520px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={mergedData} cx="50%" cy="50%" outerRadius={isMobile ? '75%' : '92%'}>
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

          {/* Month overlay */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-sm font-body font-medium text-muted-foreground/70 transition-all duration-300">
              {shortMonth}
            </span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="mt-1 space-y-1">
          {/* Timeline dots */}
          <div className="flex items-center gap-0.5 justify-center">
            {chronological.map((snap, i) => (
              <button
                key={snap.id}
                onClick={() => { setIsPlaying(false); setCurrentIdx(i); }}
                className={`rounded-full transition-all duration-200 ${
                  i === currentIdx
                    ? 'h-2.5 w-2.5 bg-secondary shadow-sm animate-pulse'
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
