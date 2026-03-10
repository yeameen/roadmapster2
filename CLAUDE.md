# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
npx tsc --noEmit         # Type check
npx vitest run           # Run all unit tests
npx vitest run src/lib/capacity.test.ts  # Run a single test file
npx playwright test      # Run E2E tests (needs dev server running)
npx supabase db reset    # Reset local DB and reapply migrations (requires Docker)
```

## Architecture

**Roadmapster** is a capacity-first quarterly planning tool. Next.js 16 App Router + Supabase + @dnd-kit.

### Data flow

Server component (`dashboard/page.tsx`) authenticates via Supabase, fetches workspace membership, then renders `DashboardClient` — the single client-side orchestrator. `DashboardClient` wires together 6 custom hooks that each manage one entity's CRUD against Supabase:

```
DashboardClient
├── useTeams(workspaceId)           → team tabs + switcher
├── usePlanningMembers(teamId)      → team settings modal
├── useQuarters(teamId)             → quarter cards
├── useEpics(teamId)                → epic cards + backlog
├── useQuarterMembers(quarterId)    → vacation days modal
└── useTeamQuarterMembers(ids[])    → batch capacity data
```

All hooks accept nullable IDs and auto-refetch when the ID changes (e.g., switching teams). They use optimistic updates with error-recovery refetch.

### Workspace invites

Server actions in `dashboard/actions.ts` handle invite/remove/rename. `createAdminClient()` (`src/lib/supabase/admin.ts`) uses the service-role key to bypass RLS for cross-user operations (adding members, looking up users by email in `auth.users`). Two SECURITY DEFINER RPCs: `accept_pending_invites()` auto-accepts invites on sign-up, `get_workspace_members_with_email()` joins members with auth emails.

### Auth flow

Middleware (`src/middleware.ts` → `src/lib/supabase/middleware.ts`) refreshes the Supabase session on every request and redirects unauthenticated users to `/login`. Login supports email/password and Google OAuth. On first sign-in, `ensureWorkspace()` auto-creates a workspace via a DB trigger that also inserts the owner membership row.

### Drag-and-drop

`PlanningBoard` uses @dnd-kit with namespaced droppable IDs (`quarter:{id}`, `backlog`, `epic:{id}`). Custom collision detection: pointer-first, fallback to closest corners. Drops are validated against capacity before persisting.

### Capacity calculation

Pure function in `src/lib/capacity.ts` (14 unit tests). Takes working days, member vacation, buffer %, on-call load, and assigned epics → returns `CapacityResult` with utilization ratio. Working days are auto-calculated from quarter start/end dates minus holidays (`src/lib/workingDays.ts`, 13 tests).

### Theme system

Three-mode toggle (system/light/dark) via `ThemeProvider` context. Persists to localStorage as `theme-mode`. Inline script in `<head>` reads preference before hydration to prevent flash. Toggles `.dark` class on `<html>`, using Tailwind's `@custom-variant dark` in `globals.css`.

### Modals

Portal-based (`Modal.tsx`), with Escape/backdrop-close, `inert` attribute on background content for focus trapping. `ConfirmDialog` is a specialized modal for destructive actions (delete epic/quarter/member).

## Key conventions

- **Hook pattern**: One hook per file in `src/hooks/`, named `use<Entity>`. Returns `{ data, loading, error, CRUD actions, refetch }`.
- **Supabase queries**: All go through RLS. Helper functions `user_workspace_ids()`, `user_team_ids()`, `user_quarter_ids()` (SECURITY DEFINER) prevent recursive policy evaluation. Additional RPCs: `accept_pending_invites()`, `get_workspace_members_with_email(ws_id)`.
- **Admin client**: `createAdminClient()` in `src/lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` for server-side operations that bypass RLS (e.g., adding workspace members, querying `auth.users`). Only use in server actions, never expose to client.
- **TEAM_DEFAULTS sync**: Constants in `src/lib/constants.ts` are duplicated in the SQL migration (`supabase/migrations/20260307000000_initial_schema.sql`). Keep both in sync.
- **Design system**: Stone palette, amber-500 accent, `rounded-2xl` cards, `rounded-xl` buttons/inputs, `shadow-warm`/`shadow-warm-md`. Button text on amber backgrounds uses `text-stone-900` (not white) for WCAG AA contrast.
- **RLS + INSERT RETURNING gotcha**: Cannot `.select()` after `.insert()` on workspaces because the SELECT policy requires membership created by an AFTER INSERT trigger that hasn't committed yet. Insert first, query separately.

## Database

8 tables: `workspaces` → `workspace_members` + `workspace_invites`, `teams` → `planning_members`, `quarters` → `quarter_members`, `epics`. All scoped by workspace membership via RLS. Epics have nullable `quarter_id` (null = backlog). Quarters store `holidays text[]` and compute `working_days` in the application layer. Workspace invites track pending/accepted/revoked email invitations with 30-day expiry.
