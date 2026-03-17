

# Iron Forums Dashboard — Implementation Plan

## Brand Identity (from ironforums.org)

The website uses a clean, professional scheme:
- **Navy/Dark Blue**: #1B3A5C (header backgrounds, hero sections, dark sections)
- **Gold/Amber**: #C8922A (CTA buttons — "Find A Forum Near You", "Member Login")
- **Off-white/Cream**: #F7F5F0 (light section backgrounds)
- **White**: #FFFFFF (cards, content areas)
- **Black**: #000000 (logo, text)
- **Font**: Clean sans-serif (system/Inter works well)

## Member Snapshot Scorecard Categories (from PDF)

Three groups with scripture references:

**Personal Life:**
- Intimacy with Jesus (Matt. 22:37-38)
- Marriage (Mark 10:8-10) — includes Spouse sub-rating
- Parenting & Children (Prov. 22:6) — includes Child sub-rating
- Mental Health (Phil. 4:6-7)
- Physical Health (1 Cor. 6:19-20)

**Business:**
- Staff (1 Thess. 5:14)
- Sales (Matt. 25:21)
- Marketing (Isaiah 53:19)
- Operations (1 Cor. 14:40)
- Finances (Luke 14:24)
- Leadership (1 Peter 5:2-3)

**Plus:** Purpose Statement, Quarterly Goal, Major Issue/Prayer Request (text fields)

## What Gets Built

### 1. Design System Update
Update CSS variables to match Iron Forums navy/gold/cream palette. Add custom colors for score tiers (gold for 7+, muted for 4-6, destructive for 1-3).

### 2. Layout Shell
- `AppSidebar` with Iron Forums logo (copied from uploaded SVG), collapsible icon mode
- Pages: Dashboard, Snapshot (scorecard), The Consultant (AI chat), Community, Admin, Profile
- Responsive header with `SidebarTrigger`, always visible
- Large readable typography for 30-70 age range — minimum 16px body, generous spacing

### 3. Auth Context (Placeholder)
- `AuthContext` with mock user, role enum (HQ Admin, Facilitator, Member, Guest)
- `ProtectedRoute` wrapper checking role
- Login page (styled, non-functional)

### 4. Dashboard Home
- Welcome card with user name and role badge
- Summary: average score, top strength, area needing attention
- Recent snapshot history list
- Quick actions: "Take Snapshot" and "Talk to Consultant"

### 5. Member Snapshot Page (Report Card)
- Header with Name, Date, Purpose Statement, Quarterly Goal fields
- Three grouped sections matching the PDF exactly:
  - Personal Life cards (Intimacy with Jesus, Marriage w/ spouse sub-score, Parenting w/ child sub-score, Mental Health, Physical Health)
  - Business cards (Staff, Sales, Marketing, Operations, Finances, Leadership)
  - Major Issue / Prayer Request textarea
- Each card: category name, scripture ref, large 1-10 slider, current value displayed prominently
- Color coding: gold (7-10), amber (4-6), crimson (1-3)
- On save: stores to local state array with timestamp
- History view: Recharts line chart showing each category over time
- Radar chart showing current snapshot at a glance

### 6. The Consultant (AI Chatbot UI)
- Clean conversation interface (not terminal — matches the professional Iron Forums brand)
- Markdown rendering with `react-markdown`
- Context-aware: when a user scores low in an area, pre-loaded prompts appear:
  - "What could you have done better in [area]?"
  - "What will you do next time?"
  - "What specific steps will raise your [area] score?"
- Prompt suggestions shown as clickable chips
- System prompt persona: seasoned Christian business leader, mentor voice, Iron Forums brand tone
- Placeholder for edge function integration (currently returns mock responses)

### 7. Community Hub
- Chapters list with member counts
- Events with RSVP
- Discussion board (posts/comments)
- Member directory with role badges
- All using mock data

### 8. Admin Panel
- Member management table
- Event creation form
- Announcement composer
- Gated by admin role check

### 9. Profile & Settings
- Profile card, edit form
- Notification toggles

## File Structure

```text
src/
  assets/
    iron-forums-logo.svg          (copied from upload)
  contexts/
    AuthContext.tsx                (mock auth with roles)
  types/
    index.ts                      (User, Rating, Chapter, Event, etc.)
  data/
    mock-data.ts                  (seed data for all features)
  components/
    layout/
      AppSidebar.tsx
      DashboardLayout.tsx
    dashboard/
      WelcomeCard.tsx
      ScoreSummary.tsx
      QuickActions.tsx
    snapshot/
      SnapshotForm.tsx
      CategoryCard.tsx
      SnapshotHistory.tsx
      RadarChart.tsx
    consultant/
      ConsultantChat.tsx
      PromptChips.tsx
      MessageBubble.tsx
    community/
      ChapterList.tsx
      EventCard.tsx
      DiscussionBoard.tsx
      MemberDirectory.tsx
    admin/
      MemberTable.tsx
      EventForm.tsx
      AnnouncementComposer.tsx
  pages/
    Index.tsx                     (Dashboard home)
    Snapshot.tsx
    Consultant.tsx
    Community.tsx
    Admin.tsx
    Profile.tsx
    Login.tsx
```

## Technical Notes
- All data in local state + localStorage for persistence across refreshes
- Recharts for line charts and radar charts
- react-markdown for AI response rendering
- Shadcn sidebar with collapsible icon mode
- CSS variables updated for Iron Forums navy/gold palette
- No backend, no auth wiring — all placeholders ready for Supabase

