import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Lightbulb, Loader2 } from 'lucide-react';
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
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
}

/**
 * Deep 12-month analysis for the demo persona.
 * These are hand-crafted to match the specific data in mock-data.ts.
 */
function generateDemoInsights(): string {
  return [
    `## 12-Month Trend Analysis`,
    ``,
    `📉 **Marriage has declined from 7 to 5 over the past year.** Your wife scored it at 3 last month — and 4 this month. The gap between how you see your marriage and how Sarah sees it is significant. You mentioned missing your anniversary in August for a client pitch in Dallas, and canceling date nights three weeks in a row in February. Those aren't small things, brother. Sarah told you she feels lonely — that took courage. She's asking you to fight for this.`,
    ``,
    `📈 **Sales is your powerhouse — up from 7 to 9 over 12 months.** You closed a $1.2M deal in September, your pipeline is overflowing, and you've had back-to-back record months. You're clearly in your zone here. The real question is: *is this success costing you the things that matter most?* Your sales don't need you to be on the road every week. Your marriage does need you home.`,
    ``,
    `🔄 **Your walk with Jesus oscillates every 2-3 months** between 5 and 7. When you attended the men's retreat in November, you jumped to 7. When travel picks up, you drop to 5. This pattern suggests your spiritual life is reactive — it responds to events rather than being anchored in daily discipline. The men's Bible study in July helped. What if you committed to something that small but consistent?`,
    ``,
    `📉 **Physical health has dropped from 7 to 4.** Combined with mental health declining to 5, your body and mind are telling you the travel pace isn't sustainable. Your doctor flagged your blood pressure in October. You put on 15 lbs. You joined a gym but only went twice. Brother, you can't pour from an empty cup. Your family needs you healthy and present — not just successful.`,
    ``,
    `⭐ **Parenting is consistently your strongest area at 8-9.** Your daughters see you — the coaching, the FaceTime calls from the road, the daddy-daughter days. Emma was proud when you coached her soccer team. This is a gift, and it's something to protect fiercely as the girls get older. They won't always want to FaceTime. Be there now.`,
    ``,
    `🎯 **Marketing remains your blind spot at 3-4 all year.** You tried Facebook ads and wasted $2K. You keep putting off the marketing hire. A Forum brother offered a connection — did you follow up? You said you're finally interviewing for a marketing director. Sales can't carry everything forever. This is the lever that unlocks scale without more travel.`,
    ``,
    `💡 **The pattern is clear:** You pour everything into the business, especially sales. The business grows, but marriage, health, and spiritual life pay the price. You're not failing — you're overextending. The men who thrive long-term in Iron Forums are the ones who learn that *less travel and more presence* isn't a business risk — it's the foundation everything else stands on.`,
  ].join('\n');
}

function generateMockInsights(snapshots: Snapshot[], categories: SnapshotCategory[]): string {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const lines: string[] = [];

  if (snapshots.length < 2) return 'Save at least 2 snapshots to see trend insights.';

  const latest = snapshots[0];
  const oldest = snapshots[snapshots.length - 1];

  // Analyze each category over full history
  for (const cat of categories) {
    const scores = snapshots.map(s => s.ratings.find(r => r.categoryId === cat.id)?.score).filter((s): s is number => s != null);
    if (scores.length < 2) continue;

    const latestScore = scores[0];
    const oldestScore = scores[scores.length - 1];
    const delta = latestScore - oldestScore;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Detect oscillation (high variance)
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const isOscillating = variance > 2;

    if (delta >= 3) {
      lines.push(`📈 **${cat.name}** has grown significantly from ${oldestScore} to ${latestScore} over ${scores.length} months. Keep investing here.`);
    } else if (delta <= -3) {
      lines.push(`📉 **${cat.name}** has declined from ${oldestScore} to ${latestScore}. This needs your attention and intentional effort.`);
    } else if (isOscillating) {
      lines.push(`🔄 **${cat.name}** oscillates between ${Math.min(...scores)} and ${Math.max(...scores)}. Consistency matters more than peaks.`);
    }
  }

  // Find strongest and weakest
  const latestRatings = [...latest.ratings].sort((a, b) => b.score - a.score);
  if (latestRatings.length > 0) {
    const top = latestRatings[0];
    const bottom = latestRatings[latestRatings.length - 1];
    lines.push(`⭐ **${catMap.get(top.categoryId)}** is your strongest area at ${top.score}/10.`);
    lines.push(`🎯 **${catMap.get(bottom.categoryId)}** at ${bottom.score}/10 is where small steps can make the biggest difference.`);
  }

  lines.push(`\n💡 You have **${snapshots.length} snapshots** recorded. Patterns become clearer with time — keep going.`);

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
    if (cached) { setInsights(cached.content); return; }

    // Demo user gets rich, hand-crafted insights
    if (isDemo) {
      const content = generateDemoInsights();
      setInsights(content);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content, timestamp: Date.now() }));
      return;
    }

    // Non-authenticated users get mock insights
    if (!user) {
      const mock = generateMockInsights(snapshots, categories);
      setInsights(mock);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ content: mock, timestamp: Date.now() }));
      return;
    }

    // Real users: call edge function
    async function fetchInsights() {
      setIsLoading(true);
      try {
        const catMap = new Map(categories.map(c => [c.id, c.name]));
        const historyLines = snapshots.slice(0, 12).map(s => {
          const scores = s.ratings.map(r => `${catMap.get(r.categoryId) || r.categoryId}: ${r.score}`).join(', ');
          const events = s.ratings.filter(r => r.lifeEvent).map(r => `${catMap.get(r.categoryId)}: "${r.lifeEvent}"`).join('; ');
          return `${s.date}: ${scores}${events ? ` | Notes: ${events}` : ''}`;
        });

        const prompt = `Analyze this member's snapshot data over ${snapshots.length} months and provide a deep, personal trend analysis. Look for: multi-month patterns (oscillations, steady declines/growth), perception gaps (self vs spouse scores), life events that correlate with score changes, and areas where small consistent effort could make a big difference. Be warm, direct, specific — like a wise older brother who cares deeply. Use markdown headers and emoji. 5-7 insights.\n\nMember: ${userName}\n\nHistory (newest first):\n${historyLines.join('\n')}`;

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], mode: 'insights' }),
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
          <Lightbulb className="h-10 w-10 text-secondary/40 mx-auto mb-3" />
          <p className="font-heading font-bold text-foreground">Your story is just beginning</p>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Complete your second monthly Snapshot and James will start spotting patterns in your journey.
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
          Deep analysis across your last {Math.min(12, snapshots.length)} months
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-32 rounded-lg shimmer-gold" />
            <span className="ml-3 text-sm font-body text-muted-foreground">James is studying your journey...</span>
          </div>
        )}
        {!isLoading && !insights && (
          <p className="text-sm font-body text-muted-foreground py-4 text-center">
            Your insights will appear here once James has enough data to work with.
          </p>
        )}
        {insights && (
          <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed [&_h1]:font-heading [&_h2]:font-heading [&_h2]:text-base [&_h2]:mt-0 [&_h2]:mb-4 [&_h3]:font-heading [&_strong]:text-foreground [&_li]:mb-1.5 [&_p]:mb-3">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
