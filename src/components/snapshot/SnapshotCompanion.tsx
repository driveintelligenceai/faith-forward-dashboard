import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, SnapshotCategory, SnapshotRating } from '@/types';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai-stream';
import { useToast } from '@/hooks/use-toast';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';

interface SnapshotCompanionProps {
  currentCategory: SnapshotCategory | null;
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
  userName: string;
}

function buildContext(
  category: SnapshotCategory | null,
  ratings: Record<string, SnapshotRating>,
  previousRatings?: Record<string, SnapshotRating>
): string {
  const parts: string[] = [];

  if (category) {
    const rating = ratings[category.id];
    const prev = previousRatings?.[category.id];
    parts.push(`Current category: ${category.name} (${category.group})`);
    parts.push(`Scripture: ${category.scriptureRef}`);
    if (category.description) parts.push(`Description: ${category.description}`);
    if (rating) {
      parts.push(`Self score: ${rating.score}/10`);
      if (rating.spouseScore !== undefined) parts.push(`Spouse score: ${rating.spouseScore}/10`);
      if (rating.childScore !== undefined) parts.push(`Child score: ${rating.childScore}/10`);
      if (rating.note) parts.push(`User note: "${rating.note}"`);
      if (rating.lifeEvent) parts.push(`Life event: "${rating.lifeEvent}"`);
    }
    if (prev) {
      parts.push(`Previous month score: ${prev.score}/10 (change: ${(rating?.score ?? 5) - prev.score})`);
    }

    // Historical trend for this specific category from past snapshots
    const historyScores = MOCK_SNAPSHOTS.slice(0, 6).map(s => {
      const r = s.ratings.find(r => r.categoryId === category.id);
      return r ? `${r.score}` : '-';
    });
    parts.push(`6-month history (newest→oldest): [${historyScores.join(', ')}]`);
  }

  // Summary of all ratings in current session
  const rated = Object.entries(ratings).filter(([, r]) => r.score > 0);
  if (rated.length > 0) {
    const avg = (rated.reduce((s, [, r]) => s + r.score, 0) / rated.length).toFixed(1);
    parts.push(`Session average: ${avg}/10 across ${rated.length} categories`);
    const low = rated.filter(([, r]) => r.score <= 4).map(([id]) => {
      const cat = SNAPSHOT_CATEGORIES.find(c => c.id === id);
      return cat?.name || id;
    });
    if (low.length) parts.push(`Low areas (≤4): ${low.join(', ')}`);
    const high = rated.filter(([, r]) => r.score >= 8).map(([id]) => {
      const cat = SNAPSHOT_CATEGORIES.find(c => c.id === id);
      return cat?.name || id;
    });
    if (high.length) parts.push(`Strong areas (≥8): ${high.join(', ')}`);

    // Flag perception gaps
    const gaps = rated.filter(([, r]) => {
      if (r.spouseScore !== undefined) return Math.abs(r.score - r.spouseScore) >= 3;
      return false;
    });
    if (gaps.length) {
      parts.push(`⚠️ Perception gaps: ${gaps.map(([id, r]) => {
        const cat = SNAPSHOT_CATEGORIES.find(c => c.id === id);
        return `${cat?.name || id} (self: ${r.score}, spouse: ${r.spouseScore})`;
      }).join('; ')}`);
    }
  }

  // Add latest snapshot context
  const latest = MOCK_SNAPSHOTS[0];
  if (latest) {
    parts.push(`Current quarterly goal: "${latest.quarterlyGoal}"`);
    parts.push(`Major issue: "${latest.majorIssue}"`);
  }

  return parts.length > 0 ? `[Snapshot context: ${parts.join('. ')}]` : '';
}

export function SnapshotCompanion({ currentCategory, ratings, previousRatings, userName }: SnapshotCompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome, ${userName.split(' ')[0]}. I'm your Snapshot Companion — here to walk with you through an honest 30-day reflection.\n\nThis isn't a test. It's a mirror. Be real with yourself and with God.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nStart by filling in your **Purpose Statement** and **Quarterly Goal**, then work through each category. I'll be right here.\n\n**Take your time. Pray as you go.**`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCategoryRef = useRef<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // React to category changes with real AI
  useEffect(() => {
    if (!currentCategory || currentCategory.id === lastCategoryRef.current || isStreaming) return;
    lastCategoryRef.current = currentCategory.id;

    const context = buildContext(currentCategory, ratings, previousRatings);
    const prompt = `The user just navigated to the "${currentCategory.name}" category. ${context}. Give a brief, contextual prompt to help them reflect on and rate this area honestly.`;

    setIsStreaming(true);
    let assistantSoFar = '';
    const assistantId = Date.now().toString();

    streamChat({
      messages: [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: prompt },
      ],
      mode: 'snapshot',
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        const currentContent = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
          }
          return [...prev, { id: assistantId, role: 'assistant', content: currentContent, timestamp: new Date().toISOString(), categoryContext: currentCategory.id }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => {
        setIsStreaming(false);
        toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
      },
    });
  }, [currentCategory]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      const context = buildContext(currentCategory, ratings, previousRatings);
      const aiMessages = [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: `${context}\n\n${text}` },
      ];

      let assistantSoFar = '';
      const assistantId = (Date.now() + 1).toString();

      await streamChat({
        messages: aiMessages,
        mode: 'snapshot',
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          const currentContent = assistantSoFar;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantId) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
            }
            return [...prev, { id: assistantId, role: 'assistant', content: currentContent, timestamp: new Date().toISOString(), categoryContext: currentCategory?.id }];
          });
        },
        onDone: () => setIsStreaming(false),
        onError: (error) => {
          setIsStreaming(false);
          toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
        },
      });
    },
    [currentCategory, ratings, previousRatings, messages, isStreaming, toast]
  );

  const quickPrompts = currentCategory
    ? [
        `Why did I rate ${currentCategory.name} this way?`,
        'Something significant happened this month',
        'Challenge me on this score',
        'What does Scripture say?',
      ]
    : [
        'Help me with my purpose statement',
        "I'm struggling right now",
        'Something big happened this month',
        'Where should I focus?',
      ];

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-primary">Snapshot Companion</p>
            <p className="text-xs font-body text-muted-foreground">
              {currentCategory ? `Discussing: ${currentCategory.name}` : 'Ready to walk with you'} · AI-Powered
            </p>
          </div>
          {currentCategory && (
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-xs font-body font-semibold">
                <Sparkles className="h-3 w-3" />
                {currentCategory.scriptureRef}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 border'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_strong]:text-foreground [&_blockquote]:border-secondary [&_blockquote]:text-muted-foreground [&_blockquote]:text-xs [&_p]:mb-2 [&_ol]:mb-2 [&_ul]:mb-2">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm font-body">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="bg-muted/50 border rounded-lg px-3.5 py-2.5">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={isStreaming}
            className="text-xs font-body font-semibold px-2.5 py-1 rounded-full border bg-background hover:bg-secondary/10 hover:border-secondary/40 transition-colors text-muted-foreground disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your Snapshot Companion..."
          className="text-sm font-body h-9"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          disabled={isStreaming}
        />
        <Button size="sm" className="h-9 px-3 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
