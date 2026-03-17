import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { buildSnapshotProfileContext } from '@/lib/snapshot-context';
import { useAuth } from '@/contexts/AuthContext';
import { useSnapshots } from '@/hooks/use-snapshots';
import type { ChatMessage, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/lib/ai-stream';
import { useToast } from '@/hooks/use-toast';

export default function Consultant() {
  const { profile } = useAuth();
  const { snapshots: dbSnapshots } = useSnapshots();
  const userName = profile?.full_name || 'Brother';
  const chapter = profile?.chapter || '';
  const role = profile?.role || 'member';

  // Use DB data if available, otherwise fall back to mock
  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;

  // Build comprehensive profile context from all snapshot data
  const profileContext = buildSnapshotProfileContext(
    allSnapshots,
    SNAPSHOT_CATEGORIES,
    userName,
    chapter,
    ROLE_LABELS[role as UserRole] || role
  );

  const latestSnapshot = allSnapshots[0];
  const weakAreas = latestSnapshot
    ? latestSnapshot.ratings
        .filter((r) => r.score <= 5)
        .map((r) => SNAPSHOT_CATEGORIES.find((c) => c.id === r.categoryId)?.name)
        .filter(Boolean)
    : [];

  const strongAreas = latestSnapshot
    ? latestSnapshot.ratings
        .filter((r) => r.score >= 8)
        .map((r) => SNAPSHOT_CATEGORIES.find((c) => c.id === r.categoryId)?.name)
        .filter(Boolean)
    : [];

  // Dynamic quick prompts based on actual data
  const dynamicPrompts = [
    weakAreas.length > 0 ? `Why is my ${weakAreas[0]} score so low?` : 'Where should I focus?',
    'What trends concern you in my data?',
    strongAreas.length > 0 ? `How do I maintain my strength in ${strongAreas[0]}?` : 'How can I grow spiritually?',
    latestSnapshot ? `Challenge me on my major issue` : 'Help with work-life balance',
    'What perception gaps do you see?',
    'Help me set better quarterly goals',
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load past chat history from DB
  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setHistoryLoaded(true);
        return;
      }
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('mode', 'consultant')
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        const restored: ChatMessage[] = data.map((row, i) => ({
          id: row.id || i.toString(),
          role: row.role as 'user' | 'assistant',
          content: row.content,
          timestamp: row.created_at,
        }));
        setMessages(restored);
      } else {
        // No history — show welcome
        setMessages([{
          id: '0',
          role: 'assistant',
          content: `**Welcome back, ${userName.split(' ')[0]}.** I'm The Consultant — your AI-powered guide rooted in Christian leadership principles.\n\nI've reviewed your last **${allSnapshots.length} months** of Snapshot data. I can see your trends, your wins, and the areas that need honest attention.\n\n${weakAreas.length > 0 ? `Right now, your areas needing the most attention are **${weakAreas.join(', ')}**. ` : ''}${strongAreas.length > 0 ? `You're strong in **${strongAreas.join(', ')}** — let's protect that. ` : ''}\n\n${latestSnapshot ? `Your current major issue: *"${latestSnapshot.majorIssue}"*\n\n` : ''}> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nWhat's on your mind today?`,
          timestamp: new Date().toISOString(),
        }]);
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [user]);

  // Persist a message to chat_history
  const persistMessage = useCallback(async (role: string, content: string) => {
    if (!user) return;
    await supabase.from('chat_history').insert({
      user_id: user.id,
      role,
      content,
      mode: 'consultant',
    });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

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

    // Build messages with full snapshot profile context injected in the first user turn
    const aiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map((m, i) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Inject profile context with every message so AI always has full picture
    const contextualMessage = `[SNAPSHOT DATA — USE THIS TO PERSONALIZE YOUR RESPONSE]\n${profileContext}\n[END SNAPSHOT DATA]\n\nUser message: ${text}`;

    aiMessages.push({ role: 'user' as const, content: contextualMessage });

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
            Personalized AI guidance based on your Snapshot history · {allSnapshots.length} months of data
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
          {dynamicPrompts.slice(0, 4).map((prompt) => (
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
