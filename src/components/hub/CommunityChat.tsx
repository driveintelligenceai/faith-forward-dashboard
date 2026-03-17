import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { streamChat } from '@/lib/ai-stream';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_CHAPTERS, MOCK_EVENTS, MOCK_ANNOUNCEMENTS } from '@/data/mock-data';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

function buildContextPrompt(chapter?: string | null): string {
  const chapterInfo = MOCK_CHAPTERS.map(c =>
    `${c.name} (${c.city}, ${c.state}) — ${c.memberCount} members, meets ${c.meetingDay}s at ${c.meetingTime}, facilitated by ${c.facilitatorName}`
  ).join('\n');

  const eventInfo = MOCK_EVENTS.map(e =>
    `${e.title} — ${new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at ${e.location}. ${e.description}`
  ).join('\n');

  const announcements = MOCK_ANNOUNCEMENTS.map(a =>
    `[${a.date}] ${a.title} — ${a.content} (by ${a.authorName})`
  ).join('\n');

  return `CONTEXT — Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
${chapter ? `User's chapter: ${chapter}` : ''}

CHAPTERS:
${chapterInfo}

UPCOMING EVENTS:
${eventInfo}

ANNOUNCEMENTS:
${announcements}`;
}

export function CommunityChat() {
  const { profile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    // Prepend context to first user message
    const contextPrefix = newMessages.length === 1 ? buildContextPrompt(profile?.chapter) + '\n\n' : '';
    const apiMessages = newMessages.map((m, i) =>
      i === 0 && m.role === 'user' ? { ...m, content: contextPrefix + m.content } : m
    );

    let assistantContent = '';
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    await streamChat({
      messages: apiMessages,
      mode: 'community' as any,
      onDelta: (text) => {
        assistantContent += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
          return updated;
        });
      },
      onDone: () => setStreaming(false),
      onError: (err) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `Sorry, I couldn't connect right now. ${err}` };
          return updated;
        });
        setStreaming(false);
      },
    });
  };

  return (
    <Card className="border-primary/10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left min-h-[44px]"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-foreground">Community Coordinator</p>
            <p className="text-xs font-body text-muted-foreground">Ask what's happening at Iron Forums</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          <div ref={scrollRef} className="h-[240px] overflow-y-auto space-y-3 pr-1 scrollbar-none">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-body text-muted-foreground">
                  Try: "What events are coming up?" or "When does my chapter meet?"
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-body ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1">
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
              placeholder="What's happening this week?"
              className="text-sm font-body"
              disabled={streaming}
            />
            <Button size="icon" onClick={send} disabled={streaming || !input.trim()} className="shrink-0 bg-primary hover:bg-primary/90">
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
