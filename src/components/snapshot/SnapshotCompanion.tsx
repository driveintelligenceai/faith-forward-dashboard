import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage, SnapshotCategory, SnapshotRating } from '@/types';
import ReactMarkdown from 'react-markdown';

interface SnapshotCompanionProps {
  currentCategory: SnapshotCategory | null;
  ratings: Record<string, SnapshotRating>;
  previousRatings?: Record<string, SnapshotRating>;
  userName: string;
}

function getContextualResponse(
  category: SnapshotCategory | null,
  rating: SnapshotRating | null,
  prevRating: SnapshotRating | null,
  input: string
): string {
  const lower = input.toLowerCase();
  const score = rating?.score ?? 5;
  const prevScore = prevRating?.score;
  const changed = prevScore !== undefined ? score - prevScore : 0;

  // Life event detection
  if (lower.includes('lost') || lower.includes('death') || lower.includes('passed away') || lower.includes('funeral')) {
    return `Brother, I'm sorry for your loss. Grief is heavy, and it's okay to sit in that for a moment.\n\n> *"The Lord is close to the brokenhearted and saves those who are crushed in spirit." — Psalm 34:18*\n\nThis is a significant life event. Would you like me to note this on your Snapshot so you can look back and understand the context of this season? Sometimes a dip in our scores isn't failure — it's faithfulness through suffering.`;
  }

  if (lower.includes('promotion') || lower.includes('new job') || lower.includes('hired') || lower.includes('deal closed')) {
    return `That's a significant milestone, brother. Congratulations! But here's the real question — **has this success drawn you closer to God or further from Him?**\n\nProsperity is a harder test than adversity. Guard your heart.\n\n> *"Humility comes before honor." — Proverbs 18:12*\n\nWant to annotate this win on your Snapshot? It'll be encouraging to look back on.`;
  }

  if (lower.includes('divorce') || lower.includes('separation') || lower.includes('affair')) {
    return `Brother, thank you for being honest. That takes real courage. This group exists for moments exactly like this — not to judge, but to lock arms with you.\n\n**You are not disqualified.** God's grace is sufficient.\n\n> *"He heals the brokenhearted and binds up their wounds." — Psalm 147:3*\n\nLet's mark this season on your Snapshot. Your forum brothers need to know so they can support you. Can you share more about where you are right now?`;
  }

  if (!category) {
    if (lower.includes('purpose') || lower.includes('why')) {
      return `Your purpose statement is your North Star. Ask yourself:\n\n1. **What breaks your heart?** That's often where your calling lives.\n2. **What unique gifts has God given you?** Your skills aren't accidents.\n3. **Who are you serving?** Purpose always points outward.\n\n> *"For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do." — Ephesians 2:10*\n\nTake your time here. A clear purpose statement shapes everything else.`;
    }
    return `I'm here to help you work through your Snapshot thoughtfully. Start by selecting a category, or tell me what's on your mind. I'll challenge you, encourage you, and point you back to Scripture.\n\n**Quick prompts:**\n- "Help me think through my purpose statement"\n- "I'm struggling with ___"\n- "Something big happened this month"`;
  }

  // Category-specific responses
  if (category.id === 'intimacy') {
    if (score <= 4) {
      return `A ${score} on Intimacy with Jesus — brother, let's talk about that honestly. No shame here.\n\n**What's gotten in the way?** Busyness? Distraction? Unresolved sin?\n\nHere's a simple reset:\n1. **5 minutes tomorrow morning** — before your phone. Just Psalm 23.\n2. **One honest prayer** — "God, I've been distant. Draw me back."\n3. **Tell one brother** — Accountability multiplies follow-through.\n\n> *"Draw near to God and He will draw near to you." — James 4:8*\n\nWhat specifically has kept you from time with the Lord?`;
    }
    if (score >= 8) {
      return `An ${score} on Intimacy with Jesus is exceptional. What's been fueling that? New discipline? A study? A season of clarity?\n\n**Challenge:** Are you pouring into someone else from this overflow? Iron sharpens iron — your walk could ignite another man's faith.\n\n> *"From everyone who has been given much, much will be demanded." — Luke 12:48*\n\nWhat's your anchor practice right now?`;
    }
    return `A ${score} on your walk with Jesus — solid middle ground. But here's my challenge: **are you coasting or climbing?**\n\nAverage in this category shouldn't feel comfortable. What would it take to get to an 8?\n\n> *"Blessed are those who hunger and thirst for righteousness." — Matt. 5:6*`;
  }

  if (category.id === 'marriage') {
    const spouseScore = rating?.spouseScore;
    if (spouseScore !== undefined && Math.abs(score - spouseScore) >= 3) {
      return `I notice your score is ${score} but your spouse's is ${spouseScore}. That ${Math.abs(score - spouseScore)}-point gap is telling. **Perception gaps in marriage are where conflict hides.**\n\nHave you asked her lately: *"How are WE doing?"* — and then just listened?\n\n> *"Be quick to listen, slow to speak." — James 1:19*\n\nWhat do you think she'd say is the #1 thing she needs from you right now?`;
    }
    if (score <= 4) {
      return `Brother, a ${score} in marriage means something needs attention NOW. This is your most important earthly relationship.\n\n**Three things this week:**\n1. Put your phone down at dinner. Be fully present.\n2. Ask her: "What's one thing I could do that would make you feel truly loved?"\n3. Pray for her — by name, out loud, even if she doesn't hear it.\n\n> *"Husbands, love your wives, just as Christ loved the church." — Eph. 5:25*\n\nWhat's the biggest strain right now?`;
    }
    return `A ${score} in marriage — ${score >= 7 ? "that's strong. What's making it work?" : "there's room to grow."}\n\n**Quick gut-check:** When was your last real date night — no phones, no kids, no business talk?\n\n> *"The two shall become one flesh." — Mark 10:8*`;
  }

  if (category.id === 'parenting') {
    return `Parenting score of ${score}. ${score >= 7 ? "You're being intentional — that matters more than you know." : "Let me challenge you."}\n\n**The real question:** If your kids described their dad to a friend, what would they say? Would they say you're *present* or just *providing*?\n\n${score <= 5 ? "Pick ONE child this week. Take them out — just the two of you. No agenda. Just be Dad." : "What's working well that other fathers could learn from?"}\n\n> *"Train up a child in the way he should go; even when he is old he will not depart from it." — Prov. 22:6*`;
  }

  if (category.id === 'mental_health') {
    if (score <= 4) {
      return `A ${score} on mental health is a flag I take seriously. **You are not weak for struggling.** You are wise for acknowledging it.\n\n**Practical steps:**\n1. Talk to someone — a counselor, pastor, or trusted brother. Today.\n2. Identify your biggest anxiety right now. Name it.\n3. Hand it to God — literally pray: "I can't carry this. You take it."\n\n> *"Cast all your anxiety on him because he cares for you." — 1 Peter 5:7*\n\nBrother, is there something specific weighing on you? I'm here to listen.`;
    }
    return `Mental health at ${score}. ${score >= 7 ? "You're managing well. What practices are keeping you grounded?" : "What's draining your peace right now?"}\n\n> *"Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God." — Phil. 4:6*`;
  }

  if (category.id === 'physical_health') {
    return `Physical health at ${score}. ${score <= 4 ? "Your body is a temple, brother — and temples need maintenance." : score >= 8 ? "Strong discipline here. What's your routine?" : "Middle of the road. Let's push."}\n\n${score <= 5 ? "**Start small:** 20-minute walk, 3x this week. That's it. Don't overcomplicate it." : "**Challenge:** What's one physical goal you can hit by your next Snapshot?"}\n\n> *"Do you not know that your bodies are temples of the Holy Spirit?" — 1 Cor. 6:19*`;
  }

  // Trend-based responses for any category
  if (changed >= 3) {
    return `**${category.name} jumped ${changed} points!** That's a major improvement. What changed?\n\nI'd love to capture this — **was there a specific event, decision, or habit** that drove this? Documenting wins helps you repeat them.\n\n> *"Give thanks to the Lord, for he is good." — Psalm 107:1*`;
  }

  if (changed <= -3) {
    return `**${category.name} dropped ${Math.abs(changed)} points.** That's significant. Let's not gloss over it.\n\nWhat happened this month? Sometimes a drop signals:\n- A crisis that needs addressing\n- Burnout from overcommitment\n- A blind spot you haven't seen\n\nWhich resonates? Be honest — that's what this process is for.\n\n> *"The righteous may fall seven times but still get up." — Prov. 24:16*`;
  }

  // Generic category response
  return `You rated **${category.name}** a ${score}. ${score >= 7 ? "That's above average — good." : score <= 4 ? "That needs attention." : "Right at the middle."}\n\n**My challenge:** What's ONE thing you could do in the next 7 days to move this number up by 1 point? Just one.\n\nSmall, consistent improvements compound over time. Don't try to overhaul — just sharpen.\n\n> *"${category.scriptureRef}"*\n\nTell me more about where you are with this.`;
}

export function SnapshotCompanion({ currentCategory, ratings, previousRatings, userName }: SnapshotCompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome, ${userName.split(' ')[0]}. I'm your Snapshot Companion — here to walk with you through an honest 30-day reflection.\n\nThis isn't a test. It's a mirror. Be real with yourself and with God.\n\n> *"As iron sharpens iron, so one man sharpens another." — Proverbs 27:17*\n\nStart by filling in your **Purpose Statement** and **Quarterly Goal**, then work through each category. I'll be right here — asking questions, challenging your thinking, and pointing you to Scripture.\n\n**Take your time. Pray as you go.**`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // React to category changes
  useEffect(() => {
    if (!currentCategory || currentCategory.id === lastCategoryRef.current) return;
    lastCategoryRef.current = currentCategory.id;
    const rating = ratings[currentCategory.id] ?? null;
    const prevRating = previousRatings?.[currentCategory.id] ?? null;

    setIsTyping(true);
    const timer = setTimeout(() => {
      const response = getContextualResponse(currentCategory, rating, prevRating, `rating ${currentCategory.name}`);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
          categoryContext: currentCategory.id,
        },
      ]);
      setIsTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentCategory, ratings, previousRatings]);

  const sendMessage = useCallback(
    (text: string) => {
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
        const rating = currentCategory ? ratings[currentCategory.id] ?? null : null;
        const prevRating = currentCategory && previousRatings ? previousRatings[currentCategory.id] ?? null : null;
        const response = getContextualResponse(currentCategory, rating, prevRating, text);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            categoryContext: currentCategory?.id,
          },
        ]);
        setIsTyping(false);
      }, 1000);
    },
    [currentCategory, ratings, previousRatings]
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
              {currentCategory ? `Discussing: ${currentCategory.name}` : 'Ready to walk with you'}
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
        {isTyping && (
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
            className="text-xs font-body font-semibold px-2.5 py-1 rounded-full border bg-background hover:bg-secondary/10 hover:border-secondary/40 transition-colors text-muted-foreground"
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
        />
        <Button size="sm" className="h-9 px-3 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
