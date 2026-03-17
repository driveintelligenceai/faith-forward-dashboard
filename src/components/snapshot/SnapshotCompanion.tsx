import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

    // Historical trend from real snapshots
    if (allSnapshots && allSnapshots.length > 1) {
      const historyScores = allSnapshots.slice(0, 6).map(s => {
        const r = s.ratings.find(r => r.categoryId === category.id);
        return r ? `${r.score}` : '-';
      });
      parts.push(`6-month history (newest→oldest): [${historyScores.join(', ')}]`);
    }
  }

  // Summary of all ratings
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

export function SnapshotCompanion({ currentCategory, ratings, previousRatings, userName, allSnapshots }: SnapshotCompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey ${userName.split(' ')[0]} 👋 I'm here to walk with you through your Snapshot.\n\nTap any category and adjust your score — I'll check in with you about it.\n\n**Take your time. Be honest.**`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCategoryRef = useRef<string | null>(null);
  const scorePromptsRef = useRef<Set<string>>(new Set()); // Track which categories got a proactive prompt
  const exchangeCountRef = useRef<Map<string, number>>(new Map()); // 2-prompt max per category
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Proactive AI: react when user CHANGES a score (not just navigates)
  useEffect(() => {
    if (!currentCategory || isStreaming) return;
    
    const catId = currentCategory.id;
    const currentScore = ratings[catId]?.score;
    const prevScore = previousRatings?.[catId]?.score;
    
    // Only fire once per category, and only when they've actually engaged with it
    if (scorePromptsRef.current.has(catId)) return;
    if (catId === lastCategoryRef.current) return;
    
    lastCategoryRef.current = catId;
    scorePromptsRef.current.add(catId);
    exchangeCountRef.current.set(catId, 0);

    const context = buildContext(currentCategory, ratings, previousRatings, allSnapshots);
    
    // Craft a focused, nurturing question
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
      
      // Enforce 2-prompt max per category
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
      
      // Check if we should wrap up this category
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

  const quickPrompts = currentCategory
    ? [
        'Tell me more',
        'Something happened this month',
      ]
    : [
        'Help me get started',
        'Where should I focus?',
      ];

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-primary/5 rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold text-primary">Snapshot Companion</p>
            <p className="text-xs font-body text-muted-foreground truncate">
              {currentCategory ? `${currentCategory.name}` : 'Ready to walk with you'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 border'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none font-body text-sm leading-relaxed [&_p]:mb-1.5 [&_strong]:text-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm font-body">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="bg-muted/50 border rounded-lg px-3 py-2">
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
      <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            disabled={isStreaming}
            className="text-xs font-body font-semibold px-2.5 py-1.5 rounded-full border bg-background hover:bg-secondary/10 hover:border-secondary/40 transition-colors text-muted-foreground disabled:opacity-50 min-h-[32px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Share what's on your heart..."
          className="text-sm font-body h-10"
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          disabled={isStreaming}
        />
        <Button size="sm" className="h-10 w-10 shrink-0 p-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
