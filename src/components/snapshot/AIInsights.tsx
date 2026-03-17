import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Activity, Lightbulb, Loader2 } from 'lucide-react';
import type { Snapshot, SnapshotCategory } from '@/types';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
  userName: string;
}

const CACHE_KEY = 'ai-insights-cache';

function getCachedInsights(): { content: string; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache for 10 minutes
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

function generateMockInsights(snapshots: Snapshot[], categories: SnapshotCategory[]): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const latest = snapshots[0];
  const previous = snapshots[1];
  const lines: string[] = [];

  if (latest && previous) {
    // Find biggest improvement and decline
    let bestDelta = -Infinity, worstDelta = Infinity;
    let bestCat = '', worstCat = '';
    let bestScore = 0, worstScore = 0;

    for (const r of latest.ratings) {
      const prev = previous.ratings.find(p => p.categoryId === r.categoryId);
      if (!prev) continue;
      const delta = r.score - prev.score;
      const name = catMap.get(r.categoryId) || r.categoryId;
      if (delta > bestDelta) { bestDelta = delta; bestCat = name; bestScore = r.score; }
      if (delta < worstDelta) { worstDelta = delta; worstCat = name; worstScore = r.score; }
    }

    if (bestDelta > 0) {
      lines.push(`📈 **${bestCat}** improved by ${bestDelta} point${bestDelta > 1 ? 's' : ''} to ${bestScore}/10 — great momentum, keep it going!`);
    }
    if (worstDelta < 0) {
      lines.push(`📉 **${worstCat}** dropped by ${Math.abs(worstDelta)} point${Math.abs(worstDelta) > 1 ? 's' : ''} to ${worstScore}/10 — consider what changed and how you can address it.`);
    }

    // Find lowest score
    const sorted = [...latest.ratings].sort((a, b) => a.score - b.score);
    if (sorted.length > 0) {
      const lowest = sorted[0];
      const lowestName = catMap.get(lowest.categoryId) || lowest.categoryId;
      lines.push(`🎯 **${lowestName}** is your lowest area at ${lowest.score}/10 — small, consistent steps here can make the biggest difference.`);
    }

    // Find highest score
    if (sorted.length > 1) {
      const highest = sorted[sorted.length - 1];
      const highestName = catMap.get(highest.categoryId) || highest.categoryId;
      lines.push(`⭐ **${highestName}** is your strongest area at ${highest.score}/10 — this is a foundation you can build on.`);
    }
  }

  lines.push(`💡 You have **${snapshots.length} snapshot${snapshots.length > 1 ? 's' : ''}** recorded. Keep tracking monthly to unlock deeper trend analysis.`);

  return lines.join('\n\n');
}

export function AIInsights({ snapshots, categories, userName }: AIInsightsProps) {
  const { user, profile } = useAuth();
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDemo = profile?.user_id === 'demo';

  useEffect(() => {
    if (snapshots.length < 2) return;

    const cached = getCachedInsights();
    if (cached) {
      setInsights(cached.content);
      return;
    }

    // For demo users or when no real auth, use mock insights
    if (isDemo || !user) {
      const mock = generateMockInsights(snapshots, categories);
      setInsights(mock);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content: mock, timestamp: Date.now() }));
      return;
    }

    async function fetchInsights() {
      setIsLoading(true);

      try {
        const catMap = new Map(categories.map(c => [c.id, c.name]));
        const historyLines = snapshots.slice(0, 6).map(s => {
          const scores = s.ratings.map(r => `${catMap.get(r.categoryId) || r.categoryId}: ${r.score}`).join(', ');
          return `${s.date}: ${scores}`;
        });

        const prompt = `Analyze this member's snapshot data over ${snapshots.length} months and provide 3-5 brief, actionable insights. Focus on: patterns (oscillations, steady declines/growth), areas needing attention, and specific encouragement. Be warm, supportive, and brief. Use bullet points with emoji icons.\n\nMember: ${userName}\n\nHistory (newest first):\n${historyLines.join('\n')}`;

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              mode: 'insights',
            }),
          }
        );

        if (!resp.ok) throw new Error('Failed to fetch insights');

        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let content = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            try {
              const parsed = JSON.parse(json);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) content += delta;
            } catch { /* skip */ }
          }
        }

        setInsights(content);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content, timestamp: Date.now() }));
      } catch (err) {
        console.error('Insights error:', err);
        // Fallback to mock insights on failure
        const mock = generateMockInsights(snapshots, categories);
        setInsights(mock);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();
  }, [user, snapshots.length, isDemo]);

  if (snapshots.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-heading font-bold text-muted-foreground">Need More Data</p>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Save at least 2 snapshots to unlock AI-powered trend analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-secondary" />
          <CardTitle className="text-lg font-heading">AI Insights</CardTitle>
        </div>
        <p className="text-sm font-body text-muted-foreground">
          Patterns and trends from your last {Math.min(6, snapshots.length)} months
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            <span className="ml-2 text-sm font-body text-muted-foreground">Analyzing your data...</span>
          </div>
        )}
        {error && (
          <p className="text-sm font-body text-destructive py-4">{error}</p>
        )}
        {insights && (
          <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_strong]:text-foreground [&_li]:mb-1.5">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
