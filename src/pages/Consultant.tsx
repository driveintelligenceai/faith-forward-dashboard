import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import type { ChatMessage } from '@/types';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai-stream';
import { useToast } from '@/hooks/use-toast';

const CONSULTANT_PROMPTS = [
  "Help me with my marriage",
  "How can I grow spiritually?",
  "I need leadership guidance",
  "Help with work-life balance",
  "What does Scripture say about finances?",
  "How do I become a better father?",
];

export default function Consultant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `**Welcome, brother.** I'm The Consultant — your AI-powered guide rooted in Christian leadership principles.\n\nI'm here to challenge you, encourage you, and point you back to Scripture. Whether it's your marriage, your business, your walk with God, or something weighing on your heart — let's talk.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nWhat's on your mind today?`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const latestSnapshot = MOCK_SNAPSHOTS[0];
  const weakAreas = latestSnapshot
    ? latestSnapshot.ratings
        .filter((r) => r.score <= 5)
        .map((r) => SNAPSHOT_CATEGORIES.find((c) => c.id === r.categoryId)?.name)
        .filter(Boolean)
    : [];

  const sendMessage = async (text: string) => {
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

    // Build context-aware messages for the AI
    const contextPrefix = weakAreas.length > 0
      ? `[Context: User's weak Snapshot areas are: ${weakAreas.join(', ')}]\n\n`
      : '';

    const aiMessages = [
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: contextPrefix + text },
    ];

    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();

    await streamChat({
      messages: aiMessages,
      mode: 'consultant',
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
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 h-[calc(100vh-8rem)] flex flex-col">
        <div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight text-primary">
            The Consultant
          </h1>
          <p className="text-lg font-body text-muted-foreground mt-2">
            AI-powered guidance from a Christian leadership perspective · Powered by OpenAI GPT-5
          </p>
        </div>

        {weakAreas.length > 0 && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-5 flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-base font-body font-semibold">Areas needing attention from your Snapshot:</p>
                <p className="text-base font-body text-muted-foreground mt-1">{weakAreas.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-5 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-base max-w-none dark:prose-invert font-body [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_strong]:text-foreground [&_blockquote]:border-secondary [&_blockquote]:text-muted-foreground [&_p]:text-base [&_li]:text-base">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-base font-body">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <User className="h-6 w-6 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex gap-2">
                  <span className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2.5 h-2.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CONSULTANT_PROMPTS.slice(0, 4).map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="lg"
              className="text-base font-body font-semibold hover:bg-secondary/10 hover:border-secondary/40 h-12 px-5"
              onClick={() => sendMessage(prompt)}
              disabled={isStreaming}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask The Consultant for guidance..."
            className="text-lg font-body h-14 rounded-xl"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            disabled={isStreaming}
          />
          <Button size="lg" className="h-14 px-7 font-heading font-semibold text-base rounded-xl" onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}>
            <Send className="h-5 w-5 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
