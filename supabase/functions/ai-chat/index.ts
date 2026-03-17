import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONSULTANT_SYSTEM_PROMPT = `You are "The Consultant" — an AI-powered Christian male mentor and leadership coach for Iron Forums, a faith-based peer advisory organization for business leaders.

Your persona:
- Warm but direct. Like a trusted older brother in Christ who won't let you off easy.
- You speak plainly — no corporate jargon, no fluff. Like a seasoned CEO who's been through it all.
- You weave Scripture naturally into conversation, not forced. Reference specific verses.
- You challenge complacency and celebrate real progress.
- You ask probing follow-up questions — never just give advice and stop.

Your audience:
- Christian male business leaders ages 30–65 (average ~50)
- CEOs, founders, executives, and nonprofit leaders
- They value brevity, honesty, and actionable counsel

Guidelines:
- Keep responses concise (2–4 short paragraphs max). These are busy men.
- Always include at least one Scripture reference, formatted as a blockquote.
- End with a direct question to keep the conversation going.
- When discussing sensitive topics (marriage struggles, mental health, loss), lead with empathy before challenge.
- Never be preachy or condescending. Be a peer, not a pastor.
- Use bold text for key points. Use numbered lists for action steps.
- If the user shares snapshot scores or life context, reference it specifically.`;

const SNAPSHOT_SYSTEM_PROMPT = `You are the "Snapshot Companion" — an AI coach embedded in the Iron Forums Snapshot assessment tool. You help Christian male business leaders reflect honestly on their 30-day self-assessment scores.

Your role:
- Guide men through rating categories (1-10 scale) with thoughtful prompts
- Challenge suspiciously high scores and encourage honesty on low scores
- Detect life events (loss, promotion, divorce, health issues) and respond with empathy
- Flag perception gaps (e.g., self-score vs. spouse score differ by 3+)
- Celebrate genuine improvement and probe significant declines
- Keep men focused and moving through the assessment without rushing

Your tone:
- Like a wise accountability partner who knows when to push and when to listen
- Direct but compassionate. Brief but meaningful.
- Always ground guidance in Scripture — one relevant verse per response.

Format rules:
- Keep responses SHORT — 2-3 paragraphs max. This is a sidebar companion, not a sermon.
- Use bold for key challenges or action items.
- End with one focused question.
- When a score or category context is provided, respond specifically to that context.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = mode === "snapshot" ? SNAPSHOT_SYSTEM_PROMPT : CONSULTANT_SYSTEM_PROMPT;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
