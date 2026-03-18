# Remaining Tasks — CEO Demo Ready

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan.

**Goal:** Make the dashboard fully functional end-to-end for the CEO demo — real auth, real data persistence, working AI chat, seamless onboarding with baseline Snapshot.

**Priority order:**
1. Verify AI chat works (James on Journey tab)
2. Verify Snapshot scoring saves for real authenticated users
3. Add baseline Snapshot to onboarding flow
4. Push app icon to TestFlight via EAS build
5. Final E2E verification

---

## Task 1: Verify AI Chat (James) Works

The JourneyChat and SnapshotCompanion stream from the Supabase edge function `ai-chat`. Verify:
- The edge function is deployed at `https://wlljwymplmuqbpqxskzd.supabase.co/functions/v1/ai-chat`
- `ANTHROPIC_API_KEY` is set in Supabase edge function secrets
- Chat streams responses in the browser

Test: Go to ironforums.vip → Explore Demo → Journey tab → type "What am I doing best?" in chat

## Task 2: Verify Snapshot Save for Real Users

The `useSnapshots` hook in `use-snapshots.ts` writes to the `snapshots` and `snapshot_ratings` Supabase tables. Verify:
- Tables exist and RLS allows authenticated writes
- `saveSnapshot()` works for a real Google-authenticated user
- Saved data appears in the Current tab

## Task 3: Onboarding Baseline Snapshot

Add a 4th step to the onboarding flow:
- Step 1: Profile (name, company, city/state) ✅ exists
- Step 2: Snapshot type selection ✅ exists
- Step 3: Welcome ✅ exists
- Step 4: **NEW** — "Complete your baseline Snapshot" — redirect to Snapshot scoring page in score mode

## Task 4: TestFlight Icon Update

Run `eas build --platform ios` in the Iron-Forum project to push the new app icon.

## Task 5: Final E2E Verification

Browser test all flows:
1. Demo mode: Auth → Demo → Hub → Snapshot → Chat with James
2. Google login: Auth → Google → Onboarding → Baseline Snapshot → Hub
3. All pages load: Community, Events, Leadership, Snapshot (all 4 tabs)
