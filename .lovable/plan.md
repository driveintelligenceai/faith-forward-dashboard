

## What's Changing

The current Index page (Dashboard) is being demoted from the landing page. The **Snapshot page becomes the default route** users land on after login/onboarding. The old Dashboard is reimagined as a **"Community Hub"** page — focused on announcements, action items, a weekly CEO video, real member imagery, and a new "Community Coordinator" AI chatbot.

## Plan

### 1. Change the default route and navigation order
**Files:** `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/SnapshotGate.tsx`

- Swap routes: `/` → Snapshot page, `/hub` (or `/community-hub`) → new Hub page
- Reorder sidebar nav: "My Snapshot" first (`/`), then "Hub" (`/hub`), then Community, Leadership, Events
- Rename sidebar item from "Dashboard" to "Hub" with a different icon (e.g., `Home` or `Newspaper`)
- Update SnapshotGate — since Snapshot is now `/`, the gate logic needs adjusting (gate other pages, not `/`)

### 2. Rebuild the Index page as a "Hub" page
**File:** `src/pages/Index.tsx` (repurposed) or new `src/pages/Hub.tsx`

Remove: Journey Timeline, Pulse Alerts, Quick Stats row (Overall/Strongest/Focus Area cards), Welcome + snapshot CTA hero.

Keep and elevate:
- **Action Items** — stays as-is, prominent placement
- **Announcements** — pull from `MOCK_ANNOUNCEMENTS`, render as a card list with dates and author names

Add new sections:
- **Weekly CEO Video** — a card with an embedded video placeholder (YouTube/Vimeo embed or thumbnail with play button). Uses a mock URL for now. Shows Jonathan Almanzar's name, video title, and date.
- **Member Spotlight / Imagery** — a section with real Iron Forums member photos (placeholder images for now using Unsplash-style professional headshots or group photos). Could show a rotating "Member of the Month" or a photo strip of chapter gatherings.
- **Community Coordinator AI** — a chat widget (distinct from "James" the mentor). This bot answers "What's happening at Iron Forums this week?" questions — chapter events, upcoming meetings, who's attending, chapter news. Uses the existing edge function infrastructure but with a different system prompt focused on community/events/logistics rather than personal coaching.

### 3. Create the Community Coordinator AI component
**File:** `src/components/hub/CommunityChat.tsx`

- Compact chat interface (collapsible card, not full sidebar)
- System prompt: "You are the Iron Forums Community Coordinator. You help members discover what's happening across chapters — upcoming events, meeting times, chapter news, and member highlights. You are warm, concise, and focused on connecting brothers."
- Context includes: `MOCK_CHAPTERS`, `MOCK_EVENTS`, `MOCK_ANNOUNCEMENTS` data injected into the system prompt
- Uses the existing `ai-chat` edge function (or a new one) with the community-focused system prompt
- Visually distinct from James — different color accent, different icon (e.g., `Users` or `MapPin`)

### 4. Add real member imagery
- Source 3-4 high-quality stock images of professional men in business/fellowship settings (diverse, authentic-looking)
- Place in `src/assets/` and use in a hero banner or photo grid on the Hub page
- These serve as placeholders until real Iron Forums photography is provided

### 5. Database: announcements and CEO video table (optional)
- Could create `announcements` and `ceo_videos` tables for persistence, but for MVP, mock data is sufficient
- If we add tables, include RLS policies for read-all (public to authenticated users) and write (admin/ceo only)

## Page Layout (Hub)

```text
┌─────────────────────────────────────┐
│  Hero: Photo banner + greeting      │
│  "What's happening at Iron Forums"  │
├─────────────────────────────────────┤
│  Weekly CEO Video    │  Announce-   │
│  [Video embed]       │  ments list  │
│  Jonathan Almanzar   │              │
├──────────────────────┴──────────────┤
│  Action Items (existing component)  │
├─────────────────────────────────────┤
│  Community Coordinator AI Chat      │
│  "Ask what's happening this week"   │
└─────────────────────────────────────┘
```

### 6. Sidebar + Route Changes Summary

| Before | After |
|--------|-------|
| `/` → Dashboard (landing) | `/` → My Snapshot (landing) |
| `/snapshot` → My Snapshot | `/hub` → Hub (new page) |
| Sidebar: Dashboard first | Sidebar: My Snapshot first, then Hub |

