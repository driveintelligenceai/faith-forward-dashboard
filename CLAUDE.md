# Project: faith-forward-dashboard

## Stack
React + Vite + TypeScript + shadcn/ui + Tailwind CSS + Supabase

## Architecture
Iron Forums has two apps sharing one Supabase PostgreSQL database:
- **Iron-Forum:** Mobile app for members — Expo/React Native + Express API + Prisma
- **This repo (faith-forward-dashboard):** Web admin dashboard for leadership — Vite/React + Supabase SDK

### Shared Database
- **Supabase project:** `iron-forum` (ID: `wlljwymplmuqbpqxskzd`, us-east-1)
- **URL:** `https://wlljwymplmuqbpqxskzd.supabase.co`
- Dashboard connects via Supabase JS SDK using `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- Mobile app connects via Prisma ORM using a direct PostgreSQL connection string
- Both apps' tables coexist in `public` schema — no name conflicts

### Table Ownership
| Dashboard (Supabase SDK + RLS) | Mobile (Prisma) |
|---|---|
| `profiles`, `snapshots`, `snapshot_ratings`, `chat_history` | `users`, `orgs`, `chapters`, `events`, `rsvps`, `announcements`, `conversations`, `conversation_members`, `messages`, `invite_codes`, `payments`, `categories`, `posts`, `comments`, `report_cards`, `report_card_chats`, `blocks`, `reports` |

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Key Paths
- App entry: `src/App.tsx`
- Pages: `src/pages/`
- Components: `src/components/`
- Supabase client: `src/integrations/supabase/client.ts`
- Snapshot categories: `src/data/snapshot-categories.ts` (aligned with Iron-Forum source of truth)
- Types: `src/types/`
- Supabase config: `supabase/config.toml`
- Migrations: `supabase/migrations/`

## Linked Projects
- **Mobile app:** `~/Developer/src/github.com/driveintelligenceai/Iron-Forum/`
  - Stack: Expo (React Native) + Express + Prisma + PostgreSQL
  - `Iron-Forum/shared/snapshot-config.ts` is the source of truth for Snapshot category keys
  - `Iron-Forum/constants/colors.ts` and `constants/fonts.ts` are brand source of truth

## Rules
- Supabase SDK for all data access (not direct PostgreSQL)
- RLS policies protect all dashboard tables
- shadcn/ui + Tailwind for styling
- **Shared database rules:**
  - Dashboard migrations go through `supabase/migrations/` — never use Prisma for dashboard tables
  - Snapshot category keys in `src/data/snapshot-categories.ts` must match `Iron-Forum/shared/snapshot-config.ts` (camelCase Prisma field names)
  - Do NOT create, alter, or drop tables owned by the mobile app (see table ownership above)
  - Brand colors: Navy #043370, Gold #dc981b, Off-White #f1efe7 — see `src/index.css` for HSL mappings
  - Brand fonts: League Spartan (headings), Quicksand (body)
- Environment variables:
  - `VITE_SUPABASE_URL` — Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key
  - Never commit `.env` files — use `.env.tpl` with `op://` references
