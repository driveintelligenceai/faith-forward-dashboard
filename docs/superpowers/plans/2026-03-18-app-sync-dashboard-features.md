# Iron Forums: Dashboard ↔ Mobile App Feature Sync

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3 "Coming Soon" dashboard pages (Community, Events, Leadership) with real features that mirror the mobile app, reading from the shared Supabase PostgreSQL database.

**Architecture:** The dashboard (Vite/React) reads from the same Supabase PostgreSQL database that the mobile app (Expo/Express/Prisma) manages. Dashboard uses Supabase JS SDK with read-only queries against Prisma-managed tables (`users`, `chapters`, `events`, `posts`, etc.). Write operations that exist in both apps (like RSVP) call the mobile app's Express API endpoints to ensure Prisma schema integrity. The dashboard's own tables (`profiles`, `snapshots`, `snapshot_ratings`) continue using Supabase SDK directly.

**Tech Stack:** React 19, TypeScript, Vite, Supabase JS SDK, shadcn/ui, Tailwind CSS, React Router, TanStack Query

**Shared Database:** Supabase project `wlljwymplmuqbpqxskzd` (us-east-1)

**Design Philosophy:**
- Dashboard = command center (full analytics, deep content, desktop-first)
- Mobile = field tool (quick actions, messaging, touch-first)
- Both read the same data; dashboard is read-heavy, mobile is write-heavy
- Dashboard shows richer visualizations; mobile shows compact lists

---

## Feature Gap Analysis

| Feature | Mobile Has | Dashboard Has | Action |
|---------|-----------|--------------|--------|
| Member Directory | Full (search, filter, DM) | Coming Soon | **Build** |
| Discussion Boards | Full (categories, posts, comments) | Coming Soon | **Build** |
| Events | Full (list, detail, RSVP, agenda) | Coming Soon (mock data on Hub) | **Build** |
| Chapters | Detail page with members | None | **Build** |
| Messaging | Full DM + group | None | **Skip** (mobile-only) |
| Snapshot/Report Cards | Basic scoring + AI chat | Full redesign (radar, trends, narratives) | Keep separate |
| Admin Panel | Event/announcement creation | None | **Phase 2** (future) |
| User Profiles | Basic profile view | Onboarding only | **Build** profile page |

---

## File Map

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/use-supabase-query.ts` | Generic hook for querying Prisma-managed tables via Supabase SDK |
| `src/hooks/use-members.ts` | Fetch members from `users` table with search/filter |
| `src/hooks/use-chapters.ts` | Fetch chapters from `chapters` table |
| `src/hooks/use-events.ts` | Fetch events from `events` table with RSVP status |
| `src/hooks/use-posts.ts` | Fetch posts/comments from `posts`/`comments` tables |
| `src/pages/Community.tsx` | Member directory + discussion forums (replaces Coming Soon) |
| `src/pages/Events.tsx` | Event listing with RSVP + event detail modal (replaces Coming Soon) |
| `src/pages/Leadership.tsx` | Chapter directory + leadership resources (replaces Coming Soon) |
| `src/components/community/MemberDirectory.tsx` | Searchable member grid with avatars |
| `src/components/community/MemberCard.tsx` | Individual member card (name, company, chapter, role) |
| `src/components/community/PostFeed.tsx` | Discussion post list with category filter |
| `src/components/community/PostCard.tsx` | Single post card (title, excerpt, author, replies) |
| `src/components/community/PostDetail.tsx` | Full post view with comments (dialog/sheet) |
| `src/components/community/CreatePostDialog.tsx` | Create new post form |
| `src/components/events/EventList.tsx` | Event cards with date, location, RSVP |
| `src/components/events/EventDetail.tsx` | Full event view with agenda + attendees |
| `src/components/leadership/ChapterGrid.tsx` | Chapter cards with member count + meeting info |
| `src/components/leadership/ChapterDetail.tsx` | Chapter detail with member list |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Replace ComingSoon routes with real page components |
| `src/components/layout/AppSidebar.tsx` | Update nav items (remove "Coming Soon" indicators if any) |
| `src/data/mock-data.ts` | May need additional mock data for non-demo users |
| `src/types/index.ts` | Add types for Member, Chapter, Event, Post, Comment from mobile schema |

---

## Task 1: Shared Types + Data Access Layer

**Files:**
- Create: `src/types/shared.ts`
- Create: `src/hooks/use-supabase-query.ts`
- Create: `src/hooks/use-members.ts`
- Create: `src/hooks/use-chapters.ts`
- Create: `src/hooks/use-events.ts`
- Create: `src/hooks/use-posts.ts`

### Types needed (from Prisma schema → Supabase table names via @@map):

```typescript
// src/types/shared.ts
// These types map to the Prisma-managed tables in the shared database.
// Table names use @@map snake_case: users, chapters, events, posts, etc.

export interface DbUser {
  id: string;
  device_id: string;
  email: string | null;
  name: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  title: string | null;
  company: string | null;
  role: 'member' | 'chapter_admin' | 'hq_admin';
  snapshot_type: string;
  dues_status: string;
  chapter_id: string | null;
  created_at: string;
}

export interface DbChapter {
  id: string;
  name: string;
  city: string;
  state: string;
  state_code: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  description: string | null;
  next_meeting_date: string | null;
  org_id: string;
}

export interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  max_attendees: number | null;
  chapter_id: string | null;
  created_by_id: string | null;
  created_at: string;
}

export interface DbPost {
  id: string;
  title: string;
  body: string;
  is_facilitator: boolean;
  pinned: boolean;
  category_id: string | null;
  chapter_id: string | null;
  author_id: string;
  created_at: string;
}

export interface DbComment {
  id: string;
  body: string;
  post_id: string;
  author_id: string;
  created_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface DbRsvp {
  event_id: string;
  user_id: string;
  checked_in: boolean;
  created_at: string;
}
```

### Hooks pattern:

Each hook uses TanStack Query + Supabase SDK. Example:

```typescript
// src/hooks/use-members.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbUser } from '@/types/shared';

export function useMembers(search?: string, chapterId?: string) {
  return useQuery({
    queryKey: ['members', search, chapterId],
    queryFn: async () => {
      let query = supabase.from('users').select('*, chapters(name, city, state)');
      if (search) query = query.ilike('name', `%${search}%`);
      if (chapterId) query = query.eq('chapter_id', chapterId);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as (DbUser & { chapters: { name: string; city: string; state: string } | null })[];
    },
  });
}
```

- [ ] Step 1: Create `src/types/shared.ts` with all DB types listed above
- [ ] Step 2: Create `src/hooks/use-members.ts` — fetches from `users` table with search/filter
- [ ] Step 3: Create `src/hooks/use-chapters.ts` — fetches from `chapters` table with member counts
- [ ] Step 4: Create `src/hooks/use-events.ts` — fetches from `events` table with RSVP counts
- [ ] Step 5: Create `src/hooks/use-posts.ts` — fetches from `posts` + `comments` tables with author join
- [ ] Step 6: Verify queries work against the shared database (check Supabase RLS policies allow reads)
- [ ] Step 7: Commit: `feat: add shared types and data hooks for mobile-managed tables`

**Important:** Supabase RLS (Row Level Security) may block these queries. If so, either:
- Add RLS policies for `anon` or `authenticated` roles to SELECT from these tables
- Or use the `service_role` key (less secure, but works for read-only dashboard)

Check RLS status: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`

---

## Task 2: Community Page — Member Directory

**Files:**
- Create: `src/pages/Community.tsx`
- Create: `src/components/community/MemberDirectory.tsx`
- Create: `src/components/community/MemberCard.tsx`
- Modify: `src/App.tsx` — replace ComingSoon route

### Layout:

```
┌──────────────────────────────────────────────┐
│ Community                                     │
│ Your forum brothers                           │
├──────────────────────────────────────────────┤
│ [Directory] [Discussion]     [🔍 Search...  ]│
├──────────────────────────────────────────────┤
│ Filter: [All Chapters ▼] [All Roles ▼]       │
├──────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ Avatar  │ │ Avatar  │ │ Avatar  │         │
│ │ Name    │ │ Name    │ │ Name    │         │
│ │ Company │ │ Company │ │ Company │         │
│ │ Chapter │ │ Chapter │ │ Chapter │         │
│ │ Role    │ │ Role    │ │ Role    │         │
│ └─────────┘ └─────────┘ └─────────┘         │
│ ... grid of member cards ...                  │
└──────────────────────────────────────────────┘
```

- [ ] Step 1: Create `MemberCard.tsx` — avatar circle (initials), name, company/title, chapter name, role badge
- [ ] Step 2: Create `MemberDirectory.tsx` — search input, chapter filter dropdown, role filter, grid of MemberCards
- [ ] Step 3: Create `Community.tsx` page with Tabs: "Directory" and "Discussion" (Discussion tab placeholder for Task 3)
- [ ] Step 4: Update `src/App.tsx` — import Community, replace `<ComingSoon title="Community" />` with `<Community />`
- [ ] Step 5: Build and verify: member cards render with mock/demo data, search works, filters work
- [ ] Step 6: Commit: `feat: add Community page with member directory`

### Demo mode handling:
When `profile.user_id === 'demo'`, use `MOCK_MEMBERS` from `mock-data.ts`. When authenticated, query Supabase `users` table.

---

## Task 3: Community Page — Discussion Forums

**Files:**
- Create: `src/components/community/PostFeed.tsx`
- Create: `src/components/community/PostCard.tsx`
- Create: `src/components/community/PostDetail.tsx`
- Create: `src/components/community/CreatePostDialog.tsx`
- Modify: `src/pages/Community.tsx` — add Discussion tab content

### Layout:

```
┌──────────────────────────────────────────────┐
│ [Directory] [Discussion]                      │
├──────────────────────────────────────────────┤
│ Categories: [All] [Testimony] [Business] ... │
│                                    [+ Post]  │
├──────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐   │
│ │ 📝 Post Title                          │   │
│ │ Author Name · Suwanee Forum · 2d ago  │   │
│ │ Post excerpt truncated to 2 lines...  │   │
│ │ 💬 14 replies · Testimony              │   │
│ └────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────┐   │
│ │ 📝 Another Post Title                  │   │
│ │ ...                                    │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

- [ ] Step 1: Create `PostCard.tsx` — title, author, chapter, relative date, excerpt, reply count, category badge
- [ ] Step 2: Create `PostFeed.tsx` — category filter chips, list of PostCards, "Create Post" button
- [ ] Step 3: Create `PostDetail.tsx` — full post body, comment list, reply input (Sheet or Dialog)
- [ ] Step 4: Create `CreatePostDialog.tsx` — title, body (textarea), category select, submit
- [ ] Step 5: Wire into Community.tsx Discussion tab
- [ ] Step 6: Build and verify
- [ ] Step 7: Commit: `feat: add discussion forums to Community page`

### Demo mode: Use `MOCK_POSTS` from `mock-data.ts`. Real users query `posts` + `comments` tables.

---

## Task 4: Events Page

**Files:**
- Create: `src/pages/Events.tsx`
- Create: `src/components/events/EventList.tsx`
- Create: `src/components/events/EventDetail.tsx`
- Modify: `src/App.tsx` — replace ComingSoon route

### Layout:

```
┌──────────────────────────────────────────────┐
│ Events                                        │
│ Meetings & gatherings                         │
├──────────────────────────────────────────────┤
│ [Upcoming] [Past]                             │
├──────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐   │
│ │ APR  Q2 Kickoff Breakfast              │   │
│ │  7   The River Club, Suwanee, GA       │   │
│ │      5/50 attending · Forum             │   │
│ │      [RSVP]                             │   │
│ └────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────┐   │
│ │ MAY  Men's Retreat Weekend             │   │
│ │ 15   Amicalola Falls, Dawsonville, GA  │   │
│ │      6/60 attending · Retreat           │   │
│ │      [RSVP]                             │   │
│ └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

Click event → opens detail with:
- Full description
- Agenda (if available — Connect/Sharpen/Grow sections)
- Attendee list
- Add to Google Calendar link
- RSVP button

- [ ] Step 1: Create `EventList.tsx` — upcoming/past tabs, event cards with date badge, location, attendee count, RSVP button
- [ ] Step 2: Create `EventDetail.tsx` — dialog/sheet with full event info, agenda, attendees, Google Calendar link
- [ ] Step 3: Create `Events.tsx` page wrapping EventList + EventDetail
- [ ] Step 4: Update `src/App.tsx` — replace ComingSoon route
- [ ] Step 5: Build and verify
- [ ] Step 6: Commit: `feat: add Events page with listing and detail view`

### Demo mode: Use `MOCK_EVENTS` from `mock-data.ts`. Real users query `events` + `rsvps` tables.

---

## Task 5: Leadership Page — Chapter Directory

**Files:**
- Create: `src/pages/Leadership.tsx`
- Create: `src/components/leadership/ChapterGrid.tsx`
- Create: `src/components/leadership/ChapterDetail.tsx`
- Modify: `src/App.tsx` — replace ComingSoon route

### Layout:

```
┌──────────────────────────────────────────────┐
│ Leadership                                    │
│ Growth & mentoring                            │
├──────────────────────────────────────────────┤
│ CHAPTERS (21 locations)                       │
├──────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐            │
│ │ 🛡️ Suwanee    │ │ 🛡️ Alpharetta │            │
│ │ GA · 14 men  │ │ GA · 12 men  │            │
│ │ Tue 7:00 AM  │ │ Wed 7:00 AM  │            │
│ │ Gary Smith   │ │ Ben Ambuehl  │            │
│ └──────────────┘ └──────────────┘            │
│ ... grid continues ...                        │
├──────────────────────────────────────────────┤
│ LEADERSHIP RESOURCES                          │
│ [Books] [Podcasts] [Articles]   (future)     │
└──────────────────────────────────────────────┘
```

Click chapter → opens detail with member list, meeting info, next meeting date.

- [ ] Step 1: Create `ChapterGrid.tsx` — grid of chapter cards (name, city/state, member count, meeting day/time, facilitator)
- [ ] Step 2: Create `ChapterDetail.tsx` — dialog with chapter info + member list
- [ ] Step 3: Create `Leadership.tsx` page wrapping ChapterGrid
- [ ] Step 4: Update `src/App.tsx` — replace ComingSoon route
- [ ] Step 5: Build and verify
- [ ] Step 6: Commit: `feat: add Leadership page with chapter directory`

### Demo mode: Use `MOCK_CHAPTERS` from `mock-data.ts`. Real users query `chapters` + `users` tables.

---

## Task 6: Update App Routes + Cleanup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Delete: `src/pages/ComingSoon.tsx` (no longer needed)

- [ ] Step 1: Update App.tsx routes — import real pages, remove ComingSoon
- [ ] Step 2: Update AppSidebar — remove any "coming soon" indicators, ensure all 5 nav items link correctly
- [ ] Step 3: Delete ComingSoon.tsx
- [ ] Step 4: Build and verify all pages load
- [ ] Step 5: Commit: `chore: remove Coming Soon pages, wire real feature routes`

---

## Task 7: Profile Page (Member Detail View)

**Files:**
- Create: `src/pages/Profile.tsx` (or `src/components/community/MemberProfile.tsx`)
- Modify: `src/App.tsx` — add `/profile/:id` route

When you click a member in the directory, show their profile:
- Name, company, title, city/state
- Chapter membership
- Role badge
- LinkedIn link (if available)
- Member since date

- [ ] Step 1: Create profile view component
- [ ] Step 2: Add route to App.tsx
- [ ] Step 3: Link MemberCard clicks to profile route
- [ ] Step 4: Build and verify
- [ ] Step 5: Commit: `feat: add member profile view`

---

## Task 8: Final Integration + Build Verification

- [ ] Step 1: Run `npm run build` — verify zero TypeScript errors
- [ ] Step 2: Test demo mode — all pages load with mock data
- [ ] Step 3: Test Google login — verify real data loads from Supabase tables
- [ ] Step 4: Test mobile responsiveness at 375px, 768px, 1440px
- [ ] Step 5: Commit and push to main
- [ ] Step 6: Verify deployment at ironforums.vip

---

## Database Access Notes

### RLS Policy Requirements

The dashboard needs SELECT access to Prisma-managed tables. Check if RLS is enabled:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

If RLS is enabled on `users`, `chapters`, `events`, `posts`, `comments`, `categories`, `rsvps`, add policies:

```sql
-- Allow authenticated dashboard users to read member data
CREATE POLICY "Dashboard can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Dashboard can read chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Dashboard can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Dashboard can read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Dashboard can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Dashboard can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Dashboard can read rsvps" ON rsvps FOR SELECT USING (true);
```

### What NOT To Do
- **Never** write to Prisma-managed tables from the dashboard without coordination
- **Never** modify the Prisma schema without checking dashboard impact
- **Always** use the mobile Express API for write operations (RSVP, post creation) to keep Prisma integrity
- The `profiles` table (dashboard-managed) and `users` table (Prisma-managed) are separate — link them by email

---

## Future Phases (Not In This Plan)

- **Messaging** — Keep mobile-only; too complex for dashboard and not the right UX
- **Admin Panel** — Event/announcement creation from dashboard
- **Real-time sync** — Supabase Realtime for live updates
- **User account linking** — Merge `profiles` (dashboard) and `users` (mobile) into unified identity
- **Notification center** — Push notifications on mobile, in-app on dashboard
