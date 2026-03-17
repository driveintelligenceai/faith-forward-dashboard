import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { streamChat } from '@/lib/ai-stream';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

export function ConsultantWidget() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const askQuick = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput('');
    setIsStreaming(true);
    setResponse('');

    let content = '';
    await streamChat({
      messages: [
        { role: 'user', content: `[Quick question from ${profile?.full_name || 'a member'}] ${text}` },
      ],
      mode: 'consultant',
      onDelta: (chunk) => {
        content += chunk;
        setResponse(content);
      },
      onDone: () => setIsStreaming(false),
      onError: () => setIsStreaming(false),
    });
  };

  return (
    <Card className="border-primary/10">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-bold text-primary">The Consultant</p>
            <p className="text-xs font-body text-muted-foreground">AI mentoring · Private & confidential</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-body text-muted-foreground hover:text-secondary gap-1 shrink-0"
            onClick={() => navigate('/consultant')}
          >
            Full chat <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        {response ? (
          <div className="bg-muted/40 rounded-lg p-3 mb-3 max-h-[120px] overflow-y-auto">
            <div className="prose prose-sm max-w-none font-body text-sm [&_p]:mb-1 [&_strong]:text-foreground">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <p className="text-sm font-body text-muted-foreground mb-3">
            Quick question? Ask here — or open your full Snapshot for deep mentoring.
          </p>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Quick question..."
            className="text-sm font-body h-9"
            onKeyDown={(e) => e.key === 'Enter' && askQuick(input)}
            disabled={isStreaming}
          />
          <Button
            size="sm"
            className="h-9 px-3 shrink-0"
            onClick={() => askQuick(input)}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
