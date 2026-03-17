import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { streamChat } from '@/lib/ai-stream';
import { MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import { useSnapshots } from '@/hooks/use-snapshots';
import { Users, Award, CalendarDays, ArrowRight, Send, Loader2, ClipboardCheck, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import membersRetreat from '@/assets/members-retreat.jpg';

type Msg = { role: 'user' | 'assistant'; content: string };

const PAGE_CONFIG: Record<string, { icon: typeof Users; tagline: string; description: string; color: string }> = {
  Community: {
    icon: Users,
    tagline: 'Your forum brothers',
    description: 'Connect with brothers across chapters, share wins, and ask for prayer. This module is being built — but your Snapshot journey starts now.',
    color: 'text-primary',
  },
  Leadership: {
    icon: Award,
    tagline: 'Growth & mentoring',
    description: 'Access leadership resources, find a mentor, and track your development. This module is being built — but your growth journey starts with honest self-assessment.',
    color: 'text-secondary',
  },
  Events: {
    icon: CalendarDays,
    tagline: 'Meetings & gatherings',
    description: 'Discover upcoming retreats, chapter meetings, and cross-chapter events. This module is being built — meanwhile, let\'s make sure your Snapshot is dialed in.',
    color: 'text-primary',
  },
};

function buildSnapshotContext(snapshots: any[], categories: any[]): string {
  if (!snapshots.length) return 'No snapshot history yet.';
  const latest = snapshots[0];
  const lines = latest.ratings.map((r: any) => {
    const cat = categories.find((c: any) => c.id === r.categoryId);
    return `${cat?.name || r.categoryId}: ${r.score}/10`;
  });
  return `Latest snapshot (${latest.date}):\n${lines.join('\n')}\nAvg: ${(latest.ratings.reduce((s: number, r: any) => s + r.score, 0) / latest.ratings.length).toFixed(1)}`;
}

export default function ComingSoon({ title }: { title: string }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { snapshots: dbSnapshots } = useSnapshots();
  const allSnapshots = dbSnapshots.length > 0 ? dbSnapshots : MOCK_SNAPSHOTS;
  const config = PAGE_CONFIG[title] || PAGE_CONFIG.Community;
  const Icon = config.icon;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = (profile?.full_name || 'Brother')?.split(' ')[0];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const startChat = () => {
    setChatOpen(true);
    if (messages.length === 0) {
      const context = buildSnapshotContext(allSnapshots, SNAPSHOT_CATEGORIES);
      const introMsg: Msg = {
        role: 'user',
        content: `[SYSTEM CONTEXT - User: ${firstName}, Chapter: ${profile?.chapter || 'Unknown'}]\n${context}\n\nHelp me understand my snapshot scores and suggest realistic numbers I should aim for next month. Where should I focus?`,
      };

      setMessages([introMsg]);
      setStreaming(true);

      let assistantContent = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      streamChat({
        messages: [introMsg],
        mode: 'consultant',
        onDelta: (text) => {
          assistantContent += text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
            return updated;
          });
        },
        onDone: () => setStreaming(false),
        onError: () => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: "I couldn't connect right now. Try again in a moment." };
            return updated;
          });
          setStreaming(false);
        },
      });
    }
  };

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    let assistantContent = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    await streamChat({
      messages: newMessages,
      mode: 'consultant',
      onDelta: (text) => {
        assistantContent += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      },
      onDone: () => setStreaming(false),
      onError: () => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: "Connection lost. Try again." };
          return updated;
        });
        setStreaming(false);
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden h-[160px] sm:h-[200px]">
          <img src={membersRetreat} alt="Iron Forums brotherhood" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full p-5 sm:p-8">
            <div className="flex items-center gap-3">
              <Icon className="h-7 w-7 text-secondary" />
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary-foreground tracking-tight">
                {title}
              </h1>
            </div>
            <p className="text-sm font-body text-primary-foreground/70 mt-1">{config.tagline}</p>
          </div>
        </div>

        {/* Status + CTA */}
        <Card>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="border-secondary/30 text-secondary font-body text-xs shrink-0 mt-0.5">
                Coming Soon
              </Badge>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/')}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-heading font-bold gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Go to My Snapshot
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={startChat}
                className="font-heading font-bold gap-2 border-primary/20"
              >
                <Sparkles className="h-4 w-4 text-secondary" />
                AI Snapshot Coach
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat for Snapshot Coaching */}
        {chatOpen && (
          <Card className="border-secondary/20 animate-fade-in">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <Sparkles className="h-4 w-4 text-secondary" />
                <p className="text-sm font-heading font-bold text-foreground">Snapshot Coach</p>
                <p className="text-xs font-body text-muted-foreground">— Let's review your scores and set realistic targets</p>
              </div>

              <div ref={scrollRef} className="h-[300px] sm:h-[360px] overflow-y-auto space-y-3 pr-1 scrollbar-none">
                {messages.filter(m => !m.content.startsWith('[SYSTEM CONTEXT')).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-body ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1 [&>blockquote]:my-2 [&>blockquote]:border-l-secondary/40">
                          <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask about your scores, trends, or goals..."
                  className="text-sm font-body"
                  disabled={streaming}
                />
                <Button size="icon" onClick={send} disabled={streaming || !input.trim()} className="shrink-0 bg-secondary hover:bg-secondary/90">
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
