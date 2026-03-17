import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowUp, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { Snapshot, SnapshotCategory } from '@/types';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai-stream';
import { useToast } from '@/hooks/use-toast';

interface JourneyChatProps {
  snapshots: Snapshot[];
  categories: SnapshotCategory[];
  userName: string;
}

const MENTOR_NAME = 'James';

function buildJourneyContext(snapshots: Snapshot[], categories: SnapshotCategory[]): string {
  if (snapshots.length === 0) return '';
  const chrono = [...snapshots].reverse(); // oldest first
  const parts: string[] = [];

  parts.push(`Member has ${chrono.length} monthly snapshots from ${chrono[0].date} to ${chrono[chrono.length - 1].date}.`);

  // Per-category summaries
  categories.forEach(cat => {
    const scores = chrono.map(s => {
      const r = s.ratings.find(r => r.categoryId === cat.id);
      return r?.score ?? null;
    }).filter((s): s is number => s !== null);
    if (scores.length === 0) return;

    const first = scores[0];
    const last = scores[scores.length - 1];
    const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    parts.push(`${cat.name} (${cat.group}): [${scores.join(',')}] first=${first} last=${last} avg=${avg}`);

    // Life events
    const events: string[] = [];
    chrono.forEach((s, i) => {
      const r = s.ratings.find(r => r.categoryId === cat.id);
      if (r?.lifeEvent) {
        const month = new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        events.push(`${month}: "${r.lifeEvent}"`);
      }
    });
    if (events.length > 0) parts.push(`  Events: ${events.join('; ')}`);
  });

  // Latest snapshot details
  const latest = snapshots[0];
  if (latest.purposeStatement) parts.push(`Purpose: "${latest.purposeStatement}"`);
  if (latest.quarterlyGoal) parts.push(`Quarterly goal: "${latest.quarterlyGoal}"`);
  if (latest.majorIssue) parts.push(`Major issue: "${latest.majorIssue}"`);

  return `[Full Snapshot History]\n${parts.join('\n')}`;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STARTER_PROMPTS = [
  'What am I doing best?',
  'What should I focus on this month?',
  "How's my marriage been trending?",
];

export function JourneyChat({ snapshots, categories, userName }: JourneyChatProps) {
  const firstName = userName.split(' ')[0];
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<string>('');

  // Build context once
  useEffect(() => {
    contextRef.current = buildJourneyContext(snapshots, categories);
  }, [snapshots, categories]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const context = contextRef.current;
    const aiMessages = [
      ...messages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: `${context}\n\nThe member "${firstName}" asks: ${text}` },
    ];

    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();

    await streamChat({
      messages: aiMessages,
      mode: 'consultant',
      onDelta: (chunk) => {
        assistantSoFar += chunk;
        const currentContent = assistantSoFar;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === assistantId) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
          }
          return [...prev, { id: assistantId, role: 'assistant', content: currentContent }];
        });
      },
      onDone: () => setIsStreaming(false),
      onError: (error) => {
        setIsStreaming(false);
        toast({ title: 'Connection Issue', description: error, variant: 'destructive' });
      },
    });
  }, [messages, isStreaming, firstName, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/60 overflow-hidden">
      {/* Mentor header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-heading font-bold text-foreground">Ask {MENTOR_NAME}</p>
            <p className="text-[10px] font-body text-muted-foreground">Your AI accountability partner</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-4">
            <p className="text-sm font-body text-muted-foreground">
              {firstName}, ask me anything about your journey.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="space-y-1">
                <p className="text-[10px] font-body font-semibold text-secondary uppercase tracking-wider">{MENTOR_NAME}</p>
                <div className="font-body text-sm leading-relaxed text-foreground/90 [&_p]:mb-2 [&_strong]:text-foreground [&_li]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-secondary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-secondary">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider text-right">You</p>
                <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                  <p className="font-body text-sm leading-relaxed text-foreground">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="space-y-1">
            <p className="text-[10px] font-body font-semibold text-secondary uppercase tracking-wider">{MENTOR_NAME}</p>
            <div className="flex gap-1.5 py-1">
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      {/* Starter prompts */}
      {messages.length === 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {STARTER_PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isStreaming}
              className="text-xs font-body px-3 py-2 rounded-full border border-border/60 bg-muted/30 hover:bg-secondary/10 hover:border-secondary/30 transition-colors text-foreground/70 disabled:opacity-40 min-h-[36px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your journey..."
            className="resize-none pr-11 min-h-[44px] max-h-[100px] text-sm font-body rounded-xl border-border/60 bg-muted/20 focus:bg-background focus:border-secondary/40 placeholder:text-muted-foreground/50"
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-90"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
