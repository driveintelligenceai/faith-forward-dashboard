

# Comprehensive Mobile UX Overhaul + AI Insights + Simplified Scorecard

## Problem Summary

Based on the screenshot and codebase audit:

1. **Mobile is unusable** — Snapshot page has desktop-first layouts that break on 440px viewports. The score summary bar overflows, category cards are too dense, the AI companion is hidden behind a FAB with DOM manipulation (`classList.toggle`), and the mobile popup is hardcoded at 340x500px which clips off-screen.
2. **AI is passive** — The companion only speaks *after* you click a category. It should proactively help you *set* the score by asking "why did you rate yourself this way?" which is exactly the question the user wants answered.
3. **No AI Insights section** — There is no trend analysis, pattern detection, or actionable recommendations drawn from 6 months of data.
4. **The radar chart (screenshot 2)** is buried under a tab and not interactive. User wants it integrated prominently.
5. **Dashboard header** shows a role badge ("CEO") that the user already knows and wants removed.
6. **Too much visual noise** — sparklines, score labels ("Exceptional"), scripture refs, annotations, group averages all compete for attention on every card.

---

## Plan (4 Phases)

### Phase 1: Mobile-First Layout Overhaul

**DashboardLayout (`src/components/layout/DashboardLayout.tsx`)**
- Remove the role badge from the top-right header entirely.
- Ensure `px-4` padding on mobile with no horizontal overflow.

**Snapshot page (`src/pages/Snapshot.tsx`)**
- **Score summary bar**: On mobile, hide the horizontal category scroll and show only the overall average + Save button. The full category list is redundant when cards are below.
- **Category cards**: Simplify to show only: name, score (large), slider. Remove sparkline, scripture ref, score label ("Strong"), and trend arrow from the card face on mobile. Move those to the AI companion context.
- **Remove `window.prompt`** for life notes — replace with an inline expanding textarea.
- **Tabs**: Make tab triggers full-width stacked on mobile (`flex-col` below `sm`).
- **Group headers**: Remove "Group Average" text on mobile.

**Mobile AI Companion** — Replace the current FAB + DOM toggle with a proper React-controlled bottom sheet:
- Full-width sheet that slides up from bottom, 70vh height.
- Controlled via React state, not `classList.toggle`.
- Dismiss via swipe-down or X button.

### Phase 2: Proactive AI During Scoring

**Change the AI interaction model:**

Currently: User clicks category → AI gives a generic reflection prompt.
New: User *changes a score* → AI asks a focused 1-2 sentence question about why, using max 2 follow-up prompts per category.

Implementation:
- In `SnapshotCompanion`, add a `useEffect` that watches `ratings` changes (not just `currentCategory`).
- When a score changes, the AI sends one short question: "You rated Marriage a 6. What happened in the last 30 days that led to that number?" 
- If the user responds, the AI gives one supportive acknowledgment and optionally flags a pattern (e.g., "I notice this went from 8→5→8→5 over the last 4 months — is there a seasonal pattern here?").
- Tone: comforting, non-analytical, supportive, challenging only when a clear pattern exists.
- Update the edge function system prompt to enforce the 2-prompt-max rule and the nurturing tone.

**Update `supabase/functions/ai-chat/index.ts`:**
- Add a new `SNAPSHOT_SCORING_PROMPT` that instructs the AI to:
  - Ask *why* the user chose that number (1 question).
  - If historical data shows a pattern (oscillation, steady decline), mention it gently.
  - Never exceed 2 exchanges per category.
  - Be warm, brief, scripture-light (only if directly relevant).

### Phase 3: AI Insights Section

Add a new section to the Snapshot page (or as a dedicated tab replacing the current "Overview" tab):

**"AI Insights" — powered by 6-month trend analysis**

Content (generated on page load via edge function, non-streaming):
- **Patterns detected**: "Your Marriage score oscillates between 5 and 8 every quarter."
- **Consistent growth**: "Physical Health has improved 3 months in a row."
- **Areas of concern**: "Finances dropped 3 points since last quarter."
- **Actionable suggestions**: 1-2 sentences per insight.

Implementation:
- Create a new component `src/components/snapshot/AIInsights.tsx`.
- On mount, call edge function with all snapshot history + profile context.
- Use non-streaming `supabase.functions.invoke('ai-chat', { body: { mode: 'insights', ... } })`.
- Display as a clean card with 3-5 bullet insights, each with an icon (trend up/down/pattern).
- Cache in `sessionStorage` so it doesn't re-call on tab switches.

### Phase 4: Interactive Radar Chart Integration

**Promote the radar chart from a hidden tab to a prominent position:**
- Place it at the top of the "My Snapshot" tab, inside a card, *above* the category groups.
- Make it interactive: clicking a radar spoke/point scrolls to and highlights that category card.
- On mobile: render at 100% width, constrain height to 280px.
- Add a subtle AI callout below the chart: "Your weakest area is Finances (3/10). Tap to discuss with your AI companion."

---

## Technical Details

### Files to create:
- `src/components/snapshot/AIInsights.tsx` — Insights card component
- `src/components/snapshot/MobileCompanionSheet.tsx` — Bottom sheet for mobile AI

### Files to modify:
- `src/pages/Snapshot.tsx` — Simplify cards, add radar inline, wire mobile sheet, add insights
- `src/components/snapshot/SnapshotCompanion.tsx` — Proactive scoring responses, 2-prompt limit
- `src/components/layout/DashboardLayout.tsx` — Remove role badge
- `supabase/functions/ai-chat/index.ts` — Add `insights` mode and `SNAPSHOT_SCORING_PROMPT`
- `src/lib/ai-stream.ts` — Add `insights` mode support if needed

### Database:
- No schema changes needed. Insights are computed from existing `snapshots` + `snapshot_ratings` tables.

### Mobile QA Checklist (to verify after implementation):
1. Dashboard loads cleanly at 375px — no overflow, no role badge
2. Snapshot page: score summary doesn't overflow horizontally
3. Category cards show only name + score + slider on mobile
4. Bottom sheet AI companion opens/closes smoothly
5. AI asks "why" after score change, max 2 exchanges
6. Radar chart renders at full width on mobile, tappable
7. AI Insights section loads and displays 3-5 bullet points
8. Onboarding flow: all steps usable at 375px (already partially fixed)
9. Consultant page: chat history loads, input doesn't get hidden by keyboard
10. All touch targets are minimum 44px

