import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage, SnapshotCategory, SnapshotRating, Snapshot } from '@/types';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai-stream';
import { useToast } from '@/hooks/use-toast';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';

interface SnapshotCompanionProps {
  currentCategory: SnapshotCategory | null;
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
  userName: string;
  allSnapshots?: Snapshot[];
}

function buildContext(
  category: SnapshotCategory | null,
  ratings: Record<string, SnapshotRating>,
  previousRatings?: Record<string, SnapshotRating>,
  allSnapshots?: Snapshot[]
): string {
  const parts: string[] = [];

  if (category) {
    const rating = ratings[category.id];
    const prev = previousRatings?.[category.id];
    parts.push(`Current category: ${category.name} (${category.group})`);
    if (rating) {
      parts.push(`Self score: ${rating.score}/10`);
      if (rating.spouseScore !== undefined) parts.push(`Spouse score: ${rating.spouseScore}/10`);
      if (rating.childScore !== undefined) parts.push(`Child score: ${rating.childScore}/10`);
    }
    if (prev) {
      parts.push(`Previous month score: ${prev.score}/10 (change: ${(rating?.score ?? 5) - prev.score})`);
    }

    if (allSnapshots && allSnapshots.length > 1) {
      const historyScores = allSnapshots.slice(0, 6).map(s => {
        const r = s.ratings.find(r => r.categoryId === category.id);
        return r ? `${r.score}` : '-';
      });
      parts.push(`6-month history (newest→oldest): [${historyScores.join(', ')}]`);
    }
  }

  const rated = Object.entries(ratings).filter(([, r]) => r.score > 0);
  if (rated.length > 0) {
    const avg = (rated.reduce((s, [, r]) => s + r.score, 0) / rated.length).toFixed(1);
    parts.push(`Session average: ${avg}/10 across ${rated.length} categories`);
    const low = rated.filter(([, r]) => r.score <= 4).map(([id]) => {
      const cat = SNAPSHOT_CATEGORIES.find(c => c.id === id);
      return cat?.name || id;
    });
    if (low.length) parts.push(`Low areas (≤4): ${low.join(', ')}`);
  }

  return parts.length > 0 ? `[Snapshot context: ${parts.join('. ')}]` : '';
}

const MENTOR_NAME = 'James';

export function SnapshotCompanion({ currentCategory, ratings, previousRatings, userName, allSnapshots }: SnapshotCompanionProps) {
  const firstName = userName.split(' ')[0];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `${firstName}, glad you're here. Take your time with this — no rush, no judgment.\n\nAs you go through each area, I'll check in with you. Just be honest with yourself.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCategoryRef = useRef<string | null>(null);
  const scorePromptsRef = useRef<Set<string>>(new Set());
  const exchangeCountRef = useRef<Map<string, number>>(new Map());
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Proactive AI: react when user selects a category
  useEffect(() => {
    if (!currentCategory || isStreaming) return;

    const catId = currentCategory.id;
    const currentScore = ratings[catId]?.score;
    const prevScore = previousRatings?.[catId]?.score;

    if (scorePromptsRef.current.has(catId)) return;
    if (catId === lastCategoryRef.current) return;

    lastCategoryRef.current = catId;
    scorePromptsRef.current.add(catId);
    exchangeCountRef.current.set(catId, 0);

    const context = buildContext(currentCategory, ratings, previousRatings, allSnapshots);

    let prompt: string;
    if (prevScore !== undefined && currentScore !== undefined) {
      const delta = currentScore - prevScore;
      if (delta > 0) {
        prompt = `The user just selected "${currentCategory.name}" and their score is ${currentScore}/10 (up from ${prevScore} last month). ${context}. Ask ONE warm, brief question about what improved. Keep it to 2 sentences max. Be genuinely happy for them.`;
      } else if (delta < 0) {
        prompt = `The user just selected "${currentCategory.name}" and their score is ${currentScore}/10 (down from ${prevScore} last month). ${context}. Ask ONE gentle, caring question about what happened. Keep it to 2 sentences max. Be supportive, not analytical.`;
      } else {
        prompt = `The user just selected "${currentCategory.name}" and their score is ${currentScore}/10 (same as last month). ${context}. Give a brief 1-2 sentence reflection prompt. Be warm and encouraging.`;
      }
    } else {
      prompt = `The user just selected "${currentCategory.name}" with a score of ${currentScore ?? 5}/10. ${context}. Ask ONE simple, warm question: "What's behind that number for you this month?" Keep it to 2 sentences max.`;
    }

    setIsStreaming(true);
    let assistantSoFar = '';
    const assistantId = Date.now().toString();

    streamChat({
      messages: [
        ...messages.slice(-6).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: prompt },
      ],
      mode: 'snapshot_scoring',
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        const currentContent = assistantSoFar;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
          }
          return [...prev, { id: assistantId, role: 'assistant', content: currentContent, timestamp: new Date().toISOString() }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => {
        setIsStreaming(false);
        toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
      },
    });
  }, [currentCategory?.id]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      if (currentCategory) {
        const count = exchangeCountRef.current.get(currentCategory.id) || 0;
        exchangeCountRef.current.set(currentCategory.id, count + 1);
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsStreaming(true);

      const context = buildContext(currentCategory, ratings, previousRatings, allSnapshots);
      const exchangeCount = currentCategory ? (exchangeCountRef.current.get(currentCategory.id) || 0) : 0;
      const wrapUpHint = exchangeCount >= 2 ? ' This is the last exchange for this category — give a brief, warm closing acknowledgment and encourage them to move to the next area.' : '';

      const aiMessages = [
        ...messages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: `${context}${wrapUpHint}\n\n${text}` },
      ];

      let assistantSoFar = '';
      const assistantId = (Date.now() + 1).toString();

      await streamChat({
        messages: aiMessages,
        mode: 'snapshot_scoring',
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          const currentContent = assistantSoFar;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === assistantId) {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
            }
            return [...prev, { id: assistantId, role: 'assistant', content: currentContent, timestamp: new Date().toISOString() }];
          });
        },
        onDone: () => setIsStreaming(false),
        onError: (error) => {
          setIsStreaming(false);
          toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
        },
      });
    },
    [currentCategory, ratings, previousRatings, messages, isStreaming, toast, allSnapshots]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickPrompts = currentCategory
    ? ['Tell me more', 'Something happened this month']
    : ['Help me get started', 'Where should I focus?'];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mentor header — warm, personal */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-heading font-bold text-foreground">{MENTOR_NAME}</p>
            <p className="text-xs font-body text-muted-foreground">
              {currentCategory ? `Reflecting on ${currentCategory.name}` : 'Your Snapshot mentor'}
            </p>
          </div>
        </div>
      </div>

      {/* Conversation — journal-style, no chat bubbles */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="space-y-1">
                <p className="text-[11px] font-body font-semibold text-secondary uppercase tracking-wider">
                  {MENTOR_NAME}
                </p>
                <div className="font-body text-[15px] leading-relaxed text-foreground/90 [&_p]:mb-2 [&_strong]:text-foreground [&_li]:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  You
                </p>
                <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3">
                  <p className="font-body text-[15px] leading-relaxed text-foreground">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="space-y-1">
            <p className="text-[11px] font-body font-semibold text-secondary uppercase tracking-wider">
              {MENTOR_NAME}
            </p>
            <div className="flex gap-1.5 py-1">
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts — soft pills, not button-like */}
      <div className="px-5 pb-2 flex flex-wrap gap-2 shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={isStreaming}
            className="text-[13px] font-body px-3.5 py-2 rounded-full border border-border/60 bg-muted/30 hover:bg-secondary/10 hover:border-secondary/30 transition-colors text-foreground/70 disabled:opacity-40 min-h-[44px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input — open text area, not a chat input */}
      <div className="px-5 pb-5 pt-2 shrink-0">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share what's on your mind..."
            className="resize-none pr-12 min-h-[52px] max-h-[120px] text-[15px] font-body rounded-xl border-border/60 bg-muted/20 focus:bg-background focus:border-secondary/40 placeholder:text-muted-foreground/50"
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-90"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
