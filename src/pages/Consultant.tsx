import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOCK_CHAT_MESSAGES, MOCK_SNAPSHOTS } from '@/data/mock-data';
import { SNAPSHOT_CATEGORIES } from '@/data/snapshot-categories';
import type { ChatMessage } from '@/types';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CONSULTANT_PROMPTS = [
  "What could I do better in my marriage?",
  "How can I grow spiritually this month?",
  "Help me improve my leadership score",
  "I need guidance on work-life balance",
  "What does Scripture say about my finances?",
  "How do I become a better father?",
];

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('marriage') || lower.includes('spouse')) {
    return `**Marriage: A Covenant Worth Fighting For**\n\nBrother, I see your marriage score is an area you want to strengthen. Here's what I'd encourage:\n\n1. **Date your wife intentionally** — Schedule a weekly date night. No phones. No business talk. Be fully present.\n2. **Ask her this question tonight:** "What's one thing I could do this week that would make you feel truly loved?"\n3. **Pray together daily** — Even 5 minutes of shared prayer transforms a marriage.\n4. **Read together:** *Love & Respect* by Dr. Emerson Eggerichs\n\n> *"The two shall become one flesh." — Mark 10:8*\n\nYour marriage is the foundation everything else is built upon. When this is strong, everything else rises. What specific challenge are you facing right now?`;
  }

  if (lower.includes('leadership') || lower.includes('business') || lower.includes('staff')) {
    return `**Leading Like Christ in Business**\n\nStrong leadership starts with servant leadership. Here's a framework:\n\n1. **Vision clarity** — Can every team member articulate where you're headed in one sentence?\n2. **Weekly 1-on-1s** — 15 minutes per direct report. Ask: "What's blocking you? How can I help?"\n3. **Delegate outcomes, not tasks** — Trust your team with the 'what' and let them own the 'how'.\n4. **Lead from your knees** — Pray over your business decisions. Seek wise counsel.\n\n> *"Be shepherds of God's flock that is under your care, watching over them—not because you must, but because you are willing." — 1 Peter 5:2*\n\nWhat area of leadership feels most pressing right now?`;
  }

  if (lower.includes('faith') || lower.includes('spiritual') || lower.includes('jesus') || lower.includes('pray')) {
    return `**Deepening Your Walk with Christ**\n\nIntimacy with Jesus isn't about perfection—it's about consistency and hunger. Consider:\n\n1. **Morning anchor** — Before email, before news, spend 15 minutes in the Word and prayer.\n2. **Scripture memory** — Pick one verse per week. Write it on a card. Carry it.\n3. **Fast intentionally** — One meal, one day. Replace that time with prayer.\n4. **Find an accountability brother** — Iron sharpens iron. Who speaks truth into your life?\n\n> *"You shall love the Lord your God with all your heart and with all your soul and with all your mind." — Matt. 22:37*\n\nWhere do you feel most distant from God right now? Let's address that head-on.`;
  }

  return `**I'm Here to Help You Grow**\n\nBased on your latest Snapshot, here are some areas to consider:\n\n1. **Identify your lowest score** — That's where the biggest opportunity for growth lies.\n2. **Set one micro-goal** — Not five. One. Make it specific and achievable this week.\n3. **Find accountability** — Share your goal with one brother in your forum.\n4. **Revisit in 7 days** — Measure progress. Adjust. Repeat.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nTell me specifically — what area of your life feels most stuck right now? I'll give you a targeted action plan.`;
}

export default function Consultant() {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(text),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-primary">
            The Consultant
          </h1>
          <p className="text-base font-body text-muted-foreground mt-1">
            AI-powered guidance from a Christian leadership perspective
          </p>
        </div>

        {weakAreas.length > 0 && (
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-body font-semibold">Areas needing attention from your Snapshot:</p>
                <p className="text-sm font-body text-muted-foreground">{weakAreas.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert font-body [&_h1]:font-heading [&_h2]:font-heading [&_h3]:font-heading [&_strong]:text-foreground [&_blockquote]:border-secondary [&_blockquote]:text-muted-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-base font-body">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.3s]" />
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
              size="sm"
              className="text-xs font-body font-semibold hover:bg-secondary/10 hover:border-secondary/40"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask The Consultant for guidance..."
            className="text-base font-body h-12"
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          />
          <Button size="lg" className="h-12 px-6 font-heading font-semibold" onClick={() => sendMessage(input)} disabled={!input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
