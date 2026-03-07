# Roadmapster - Product Requirements Document (Rewrite)

## Document Purpose

This PRD defines Roadmapster for a clean rebuild. It incorporates lessons learned from the V1 implementation, avoids repeating known mistakes, and provides enough detail to build without assuming knowledge of the existing codebase.

**Status**: Rewrite baseline
**Date**: March 2026

---

## 1. What Roadmapster Is

Roadmapster is a capacity-first quarterly planning tool for software teams. It answers one question: given our real capacity, what work fits into upcoming quarters?

The core experience is a two-panel planning board:
- A prioritized **backlog** of epics on the left
- A vertical stack of **quarters** on the right, each showing capacity usage
- **Drag-and-drop** scheduling with immediate capacity feedback

It should feel as direct as sprint planning in Jira, but focused on quarter-level capacity decisions.

---

## 2. Problem

Teams plan quarterly work in spreadsheets, slides, and issue trackers not designed for capacity-first roadmap planning. This causes:

- Slow replanning when priorities shift
- Manual, error-prone capacity calculations
- No visibility into what fits in future quarters
- Backlog prioritization disconnected from team constraints
- Roadmap decisions scattered across tools instead of one shared system

---

## 3. Target Users

**Primary**: Product managers, engineering managers, and tech leads who own quarterly planning.

**Secondary**: Engineers who need visibility into planned work, and leadership reviewing roadmap tradeoffs.

---

## 4. Product Principles

These are constraints, not aspirations.

1. **Capacity is first-class.** Planning starts with available capacity, not a wish list.
2. **Planning must stay fast.** Drag-and-drop and editing must be frictionless.
3. **Quarter data belongs to quarters.** Working days and member availability are per-quarter, not global team settings.
4. **Planning members are not app users.** A team can model contributors without requiring accounts for each person.
5. **Build only what's needed.** Ship the schema and features required now. Don't pre-build tables for features that don't exist yet.

---

## 5. Core Concepts

### Workspace
The top-level container for a customer's data. A signed-in user belongs to one workspace. All teams and plans are scoped to it.

### Team
The unit that owns a roadmap. A workspace may contain multiple teams, but the user plans one team at a time. A team has default settings (buffer percentage, on-call config) that serve as defaults when creating new quarters.

### Planning Member
A person counted in capacity calculations. Has a name and optional skills. Does **not** need a product login. Their availability (vacation days) is configured **per quarter**, not globally.

### Quarter
A planning bucket with its own capacity settings and lifecycle status. Each quarter stores its own working days and per-member availability overrides.

### Epic
A roadmap item sized in t-shirt sizes. Either unscheduled (in backlog) or assigned to a quarter.

---

## 6. Scope

### In scope for the rewrite

- Authenticated web application (Google OAuth + email/password)
- Cloud-backed persistence via Supabase
- Workspace and team creation
- Quarter-based capacity planning with per-quarter member availability
- Epic backlog management with priority grouping
- Drag-and-drop scheduling between backlog and quarters
- Quarter-level capacity calculation and enforcement
- Multi-user access to shared team data
- Data export

### Explicitly out of scope

- Jira, HR, or calendar integrations
- Sprint planning within quarters
- Dependency graph visualization
- Scenario modeling and forecasting
- Comments, approvals, or audit log workflows
- Real-time multi-cursor collaboration
- Portfolio planning across teams in one view
- Quarter templates

---

## 7. Functional Requirements

### 7.1 Authentication and Access

- Users must sign in before accessing any roadmap data.
- Supported sign-in: Google OAuth and email/password via Supabase Auth.
- On first sign-in, create a default workspace for the user.
- Team data is visible only to users in the same workspace.

### 7.2 Workspace and Team Setup

**Workspace**: Created automatically on first sign-in. Has a name (editable).

**Team**: Created by the user within their workspace.

Each team has default settings that pre-populate new quarters:
- Buffer percentage (default: 20%)
- On-call people per sprint (default: 1)
- Sprints per quarter (default: 6)
- Default working days per quarter (default: 65)

Each team has a list of **planning members**:
- Name (required)
- Skills (optional)

Planning members are capacity inputs, not identity records. They do not require a login.

### 7.3 Quarter Management

Users can:
- Create, edit, and delete quarters
- Collapse and expand quarters on the board
- Reorder quarters

Each quarter has:
- Name (e.g., "Q2 2026")
- Status: `planning`, `active`, or `completed` (editable field, not a workflow action)
- Working days (defaults from team settings, overridable per quarter)
- Start date (optional)
- End date (optional)
- Display order

**Per-quarter member availability**: Each quarter stores availability for each planning member. When a quarter is created, it initializes availability for all current team members with 0 vacation days. Users then set vacation days per member per quarter.

Deleting a quarter returns its epics to backlog.

### 7.4 Epic Management

Users can:
- Create, edit, and delete epics
- Prioritize backlog epics
- Assign an epic to a quarter (via drag-and-drop or manual assignment)
- Move an epic back to backlog
- Reorder epics within a quarter
- Move epics between quarters

Each epic has:
- Title (required)
- Size: `XS`, `S`, `M`, `L`, `XL` (required)
- Priority: `P0`, `P1`, `P2`, `P3` (required)
- Description (optional)
- Owner name (optional, free text)

### 7.5 Planning Board

**Layout**: Two-panel, backlog left, quarters right.

**Backlog panel**:
- Groups epics by priority (P0 first)
- "Add Epic" button
- Acts as a drop zone to return epics from quarters

**Quarters panel**:
- Vertically stacked quarters, ordered by display order
- "Create Quarter" button
- Each quarter shows: name, status badge, capacity bar, epic count

**Collapsed quarter**: Shows summary only (name, status, capacity percentage, epic count).

**Expanded quarter**: Shows all assigned epics as cards, accepts drops.

**Drag-and-drop rules**:
- Use a dedicated drag handle on epic cards so clicks elsewhere open edit
- Support: backlog-to-quarter, quarter-to-quarter, quarter-to-backlog, reorder within a quarter
- Use unambiguous droppable IDs (prefix quarter drop zones, e.g., `quarter:{id}`, and backlog as `backlog`)
- Capacity is validated before accepting a drop; reject with a clear message if it would exceed capacity

### 7.6 Capacity Model

**T-shirt sizing**:
| Size | Days |
|------|------|
| XS   | 5    |
| S    | 10   |
| M    | 20   |
| L    | 40   |
| XL   | 60   |

**Quarter capacity calculation**:

```
For each planning member in this quarter:
  member_available = max(0, quarter.working_days - member_quarter_vacation_days)

total_available = sum of all member_available
oncall_load = oncall_per_sprint * sprints_per_quarter * 10
after_oncall = max(0, total_available - oncall_load)
buffer = round(after_oncall * buffer_percentage)
final_capacity = max(0, after_oncall - buffer)

used_capacity = sum of epic sizes assigned to this quarter
remaining = max(0, final_capacity - used_capacity)
utilization = used_capacity / final_capacity (as percentage)
```

On-call and buffer settings come from the team defaults (could be overridden per quarter in a future version).

**Display per quarter**:
- Capacity bar with color thresholds: green (<75%), amber (75-90%), red (>90%)
- Numeric: "X / Y days (Z%)"

### 7.7 Capacity Enforcement

- Warn visually when a quarter approaches capacity
- Prevent dropping an epic into a quarter when it would exceed capacity
- Update capacity feedback immediately on create, edit, move, or delete

### 7.8 Persistence

- All data persists to Supabase (PostgreSQL).
- No localStorage as primary storage. Local state is used only for UI responsiveness (optimistic updates).
- Export roadmap data as JSON for backup.

---

## 8. Data Model

### Design decisions from lessons learned

1. **No organization table.** Workspace is the top-level entity. An organization layer adds complexity with no current value.
2. **Vacation days are per quarter, not per member.** A member's availability varies each quarter. Store this on a join table between quarters and planning members.
3. **Planning members are team-scoped, not user-scoped.** They are names in a capacity model, not authenticated users.
4. **Only build tables you need now.** No comments, templates, audit logs, or dependency tables until those features exist.
5. **Quarter stores its own capacity settings.** Working days live on the quarter, not the team.

### Tables

```
workspaces
  id: uuid PK
  name: text
  created_by: uuid (references auth.users)
  created_at: timestamptz
  updated_at: timestamptz

workspace_members
  id: uuid PK
  workspace_id: uuid FK -> workspaces
  user_id: uuid FK -> auth.users
  role: text ('owner' | 'admin' | 'member')
  created_at: timestamptz
  UNIQUE(workspace_id, user_id)

teams
  id: uuid PK
  workspace_id: uuid FK -> workspaces
  name: text
  buffer_percentage: numeric (0.0 to 1.0)
  oncall_per_sprint: integer
  sprints_per_quarter: integer
  default_working_days: integer
  created_by: uuid FK -> auth.users
  created_at: timestamptz
  updated_at: timestamptz

planning_members
  id: uuid PK
  team_id: uuid FK -> teams (ON DELETE CASCADE)
  name: text
  skills: text[]
  created_at: timestamptz
  updated_at: timestamptz

quarters
  id: uuid PK
  team_id: uuid FK -> teams (ON DELETE CASCADE)
  name: text
  status: text ('planning' | 'active' | 'completed')
  working_days: integer
  start_date: date (nullable)
  end_date: date (nullable)
  display_order: integer
  created_at: timestamptz
  updated_at: timestamptz

quarter_members
  id: uuid PK
  quarter_id: uuid FK -> quarters (ON DELETE CASCADE)
  planning_member_id: uuid FK -> planning_members (ON DELETE CASCADE)
  vacation_days: integer (default 0)
  UNIQUE(quarter_id, planning_member_id)

epics
  id: uuid PK
  team_id: uuid FK -> teams (ON DELETE CASCADE)
  title: text
  description: text (nullable)
  size: text ('XS' | 'S' | 'M' | 'L' | 'XL')
  priority: text ('P0' | 'P1' | 'P2' | 'P3')
  quarter_id: uuid FK -> quarters (ON DELETE SET NULL, nullable)
  position: integer (default 0)
  owner: text (nullable, free text)
  created_at: timestamptz
  updated_at: timestamptz
```

### Row Level Security

**Lesson learned**: The V1 implementation required 7 migration files to fix recursive RLS policies on `team_members`. The recursion happened because access to `teams` depended on `team_members`, which depended on `teams`.

**Strategy for the rewrite**:
- Gate access at the **workspace level only**. Use `workspace_members` to determine access. This table has a simple, non-recursive check: `user_id = auth.uid()`.
- All other tables derive access through their `team.workspace_id` path, using a **security-definer function** to avoid RLS recursion.

```sql
-- Helper function (SECURITY DEFINER to bypass RLS)
CREATE FUNCTION user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = user_uuid;
$$;

-- Then all policies use:
-- USING (team_id IN (
--   SELECT id FROM teams WHERE workspace_id IN (SELECT user_workspace_ids(auth.uid()))
-- ))
```

This avoids the circular dependency that plagued V1.

### Indexes

```sql
CREATE INDEX idx_epics_team_quarter ON epics(team_id, quarter_id);
CREATE INDEX idx_quarters_team ON quarters(team_id);
CREATE INDEX idx_planning_members_team ON planning_members(team_id);
CREATE INDEX idx_quarter_members_quarter ON quarter_members(quarter_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
```

---

## 9. Technology Stack

### Chosen based on V1 experience

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js (App Router) | Worked well in V1. API routes + SSR + React in one package. |
| Language | TypeScript | Non-negotiable for a data-heavy app. |
| Database | Supabase (PostgreSQL) | Auth + DB + realtime in one service. V1 validated this choice. |
| Auth | Supabase Auth (Google OAuth + email) | Avoids rolling custom auth. |
| Drag & Drop | @dnd-kit | Worked well in V1 once IDs were disambiguated. |
| Styling | Tailwind CSS | Replaces raw CSS3 from V1 for faster development and consistency. |
| Icons | Lucide React | Lightweight, worked well. |
| Hosting | Vercel | Native Next.js support. |
| Testing | Playwright (E2E), Vitest (unit) | Playwright proved valuable in V1. Add Vitest for unit tests. |

---

## 10. Architecture Guidance

### Lessons from V1 to avoid repeating

1. **No god component.** V1's `page.tsx` held all state, all handlers, and all business logic in one 460-line file. Use a proper state layer.

2. **Separate data hooks from UI.** Each entity (teams, quarters, epics, planning members) should have its own data hook that handles Supabase queries, optimistic updates, and error states.

3. **Unambiguous drag-and-drop IDs.** V1 had bugs because epic IDs and quarter IDs could collide. Use namespaced IDs: `epic:{id}`, `quarter:{id}`, `backlog`.

4. **Don't store UI state in the database.** `isCollapsed` was stored on the quarter row in V1. Collapse state is per-user, per-session. Keep it in local component state or a lightweight client-side store.

5. **Don't embed child entities in parent objects.** V1's `Team` type had `members: TeamMember[]` baked in, which created mismatch between the frontend type and the relational DB structure. Keep types flat and compose in the UI layer.

6. **Capacity calculation is a pure function.** It takes planning members with vacation days, quarter working days, team on-call/buffer settings, and assigned epics. It returns capacity numbers. Keep it stateless and easily testable.

### Recommended component structure

```
app/
  layout.tsx                    # Root layout with auth provider
  page.tsx                      # Landing / redirect to dashboard
  login/page.tsx                # Login page
  auth/callback/route.ts        # OAuth callback handler
  dashboard/
    page.tsx                    # Main planning board
    components/
      PlanningBoard.tsx         # DndContext wrapper, two-panel layout
      BacklogPanel.tsx          # Left panel
      QuartersPanel.tsx         # Right panel
      QuarterCard.tsx           # Single quarter (collapsed or expanded)
      EpicCard.tsx              # Single epic card with drag handle
      EpicFormModal.tsx         # Create/edit epic
      QuarterFormModal.tsx      # Create/edit quarter
      CapacityBar.tsx           # Capacity visualization
      TeamSettingsModal.tsx     # Team and planning member config
      QuarterMembersModal.tsx   # Per-quarter vacation day editor
  lib/
    supabase/
      client.ts                # Browser Supabase client
      server.ts                # Server Supabase client
      middleware.ts             # Auth middleware
    capacity.ts                # Pure capacity calculation functions
    types.ts                   # TypeScript types (flat, no embedded arrays)
    constants.ts               # T-shirt sizes, colors, etc.
  hooks/
    useWorkspace.ts
    useTeam.ts
    usePlanningMembers.ts
    useQuarters.ts
    useEpics.ts
    useQuarterMembers.ts
```

---

## 11. User Experience Requirements

### Usability
- The board must be understandable without training.
- Primary actions must be visible: add epic, create quarter, open team settings.
- Support planning 1-4 future quarters without clutter.

### Visual feedback
- Capacity bar per quarter with green/amber/red thresholds.
- Clear drop zone highlighting during drag.
- Drag overlay showing the epic being moved.

### Empty states
- Empty backlog: prompt to add first epic.
- Empty quarter: clear invitation to drop epics.
- No teams: guided team creation flow.

### Interaction details
- Epic card click (outside drag handle) opens edit modal.
- Drag handle is visually distinct (grip icon).
- Quarter status is an editable dropdown, not a dedicated button per state.

---

## 12. Non-Functional Requirements

- Desktop-first responsive web app with usable tablet support
- Initial board load under 2 seconds for a typical team (50 epics, 4 quarters)
- Drag-and-drop response under 100ms
- Reliable persistence: no data loss on reload or across devices
- Workspace-level access isolation
- Test coverage for: auth flow, team setup, epic CRUD, quarter CRUD, drag-and-drop, capacity calculations, persistence

---

## 13. Build Order

### Phase 1: Core single-team planner

1. Supabase project setup (schema, auth, RLS with the security-definer approach)
2. Authentication (login, callback, session middleware)
3. Workspace auto-creation on first sign-in
4. Team creation and settings
5. Planning member management
6. Quarter CRUD with per-quarter member availability
7. Epic CRUD with backlog
8. Planning board with drag-and-drop
9. Capacity calculations and enforcement
10. Data export

### Phase 2: Shared team usage

- Multiple teams per workspace
- Team switching
- Invite users to workspace
- Access control hardening

### Later, if needed

- Integrations (Jira, calendars)
- Dependency management
- Audit history
- Comments on epics
- Quarter templates
- Advanced reporting

---

## 14. Success Criteria

The rewrite is successful when a user can:

1. Sign in with Google
2. Land in their workspace with a team creation prompt
3. Create a team with planning members
4. Create two quarters with per-member vacation days
5. Create and prioritize epics
6. Drag epics into quarters and see capacity update correctly
7. Be prevented from over-allocating a quarter
8. Reload and find the same data persisted
9. Export their roadmap as JSON

---

## 15. Open Decisions

- Whether to support read-only users (viewers) or only editors in Phase 1
- Whether export ships in Phase 1 or Phase 2
- Whether to use Tailwind CSS or stick with CSS modules (team preference)
- Exact behavior when a planning member is removed from a team mid-quarter (cascade delete from quarter_members, or soft-delete?)
