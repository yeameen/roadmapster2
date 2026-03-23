# Roadmapster - Product Requirements Document

## Document Purpose

This PRD defines Roadmapster. It incorporates lessons learned from the V1 implementation, avoids repeating known mistakes, and reflects the current state of the shipped product.

**Status**: Current (reflects implemented state)
**Last updated**: March 2026

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
The top-level container for a customer's data. A signed-in user can belong to multiple workspaces (via invites) and switch between them. All teams and plans are scoped to a workspace.

### Team
The unit that owns a roadmap. A workspace may contain multiple teams, and the user can switch between them via tabs. A team has default settings (buffer percentage, on-call config) that serve as defaults when creating new quarters.

### Planning Member
A person counted in capacity calculations. Has a name and optional skills. Does **not** need a product login. Their availability (vacation days) is configured **per quarter**, not globally.

### Quarter
A planning bucket with its own capacity settings and lifecycle status. Each quarter has required start/end dates and an optional holidays list. Working days are auto-calculated from the date range minus weekends and holidays.

### Epic
A roadmap item sized in t-shirt sizes. Either unscheduled (in backlog) or assigned to a quarter. Can optionally be linked to a Jira epic for story-level progress tracking.

---

## 6. Scope

### Implemented

- Authenticated web application (Google OAuth + email/password)
- Cloud-backed persistence via Supabase
- Workspace and team creation with multi-team support
- Workspace member invites and sharing
- Quarter-based capacity planning with per-quarter member availability
- Working days auto-calculation from quarter dates minus weekends and holidays
- Epic backlog management with priority grouping
- Drag-and-drop scheduling between backlog and quarters
- Quarter-level capacity calculation and enforcement
- Multi-user access to shared team data with workspace-level RLS
- Data export (JSON)
- One-way Jira import/sync (epics and stories via OAuth)
- Dark/light/system theme toggle
- "Warm Studio" design system (stone palette, amber accent)

### Explicitly out of scope

- HR or calendar integrations
- Sprint planning within quarters
- Dependency graph visualization
- Scenario modeling and forecasting
- Comments, approvals, or audit log workflows
- Real-time multi-cursor collaboration
- Portfolio planning across teams in one view
- Quarter templates
- Two-way Jira sync (write-back to Jira)

---

## 7. Functional Requirements

### 7.1 Authentication and Access

- Users must sign in before accessing any roadmap data.
- Supported sign-in: Google OAuth and email/password via Supabase Auth.
- On first sign-in, auto-accept any pending workspace invites matching the user's email. If no pending invites exist, create a default workspace for the user.
- Team data is visible only to users in the same workspace.

### 7.2 Workspace and Team Setup

**Workspace**: Created automatically on first sign-in (unless joining via invite). Has a name (editable by owner).

**Workspace members**: Users can be invited to a workspace by email. Invites are pending until the invitee signs up, then auto-accepted. Invites expire after 30 days. Workspace owners/admins can remove members and revoke pending invites.

**Workspace switcher**: Users who belong to multiple workspaces can switch between them from the dashboard header.

**Team**: Created by the user within their workspace. A workspace can have multiple teams, navigable via tabs.

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
- Start date (required)
- End date (required)
- Holidays (optional list of dates to exclude from working days)
- Working days (auto-calculated from start/end dates minus weekends and holidays; overridable)
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

Jira-synced epics additionally store:
- Jira epic ID and key
- Jira URL
- Story points (from Jira)
- Size override flag (whether the user manually set the size vs auto-mapped from story points)
- Last synced timestamp

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

**Working days calculation**:

Working days are auto-calculated from the quarter's start and end dates by counting weekdays (Mon-Fri) and subtracting any listed holidays. This is implemented as a pure function in `workingDays.ts` (13 unit tests).

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
- Export roadmap data as JSON for backup (available in Team Settings modal).

### 7.9 Jira Integration

One-way import/sync from Jira Cloud. Epics and their child stories are imported into Roadmapster for progress tracking. This is read-only — no data is written back to Jira.

**Connection flow**:
- Workspace owner initiates Jira OAuth 2.0 with PKCE via `/api/jira/authorize`
- Callback at `/api/jira/callback` exchanges the auth code for access/refresh tokens
- Connection stored per-workspace in `jira_connections` (one Jira site per workspace)
- Disconnect removes the connection record

**Team mapping**:
- Each team can optionally map to a Jira project key or custom JQL filter
- Configurable epic issue type (default: "Epic")
- Auto-sync toggle for scheduled background syncing (cron endpoint at `/api/cron/jira-sync`)

**Sync behavior**:
- Imports Jira epics matching the team's project/JQL filter
- For each epic, imports child stories with: key, title, status, status category (`new`/`indeterminate`/`done`), assignee, story points, issue type, Jira URL
- Jira story points are auto-mapped to t-shirt sizes (users can override)
- Sync status tracked per team mapping: `idle`, `syncing`, `error`

**UI**:
- Jira settings accessible from Team Settings modal
- Project picker dropdown for available Jira projects
- Manual sync button with status indicator
- Epic cards show a progress badge for synced epics (e.g., "3/5 done")
- Epic stories modal shows all child stories with status and aggregations

### 7.10 Theme System

Three-mode theme toggle: system, light, dark.

- Persists selection to localStorage as `theme-mode`
- Inline script in `<head>` reads preference before hydration to prevent flash
- Toggles `.dark` class on `<html>`, using Tailwind's `@custom-variant dark`
- System mode tracks OS preference via `prefers-color-scheme` media query

### 7.11 Design System

"Warm Studio" design language:

- **Palette**: `stone-*` (warm gray) backgrounds and text, `amber-500` accent
- **Cards**: `rounded-2xl` with warm shadows (`shadow-warm` / `shadow-warm-md` using `rgba(120,100,70,...)`)
- **Buttons/inputs**: `rounded-xl`
- **Status colors**: planning = amber, active = green, completed = stone
- **Size colors**: XS = blue, S = cyan, M = purple, L = orange, XL = red
- **Contrast**: Text on amber backgrounds uses `text-stone-900` (not white) for WCAG AA compliance

---

## 8. Data Model

### Design decisions from lessons learned

1. **No organization table.** Workspace is the top-level entity. An organization layer adds complexity with no current value.
2. **Vacation days are per quarter, not per member.** A member's availability varies each quarter. Store this on a join table between quarters and planning members.
3. **Planning members are team-scoped, not user-scoped.** They are names in a capacity model, not authenticated users.
4. **Quarter stores its own capacity settings.** Working days live on the quarter, not the team.

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

workspace_invites
  id: uuid PK
  workspace_id: uuid FK -> workspaces (ON DELETE CASCADE)
  email: text
  invited_by: uuid FK -> auth.users
  status: text ('pending' | 'accepted' | 'revoked')
  created_at: timestamptz
  expires_at: timestamptz (default: 30 days from creation)
  UNIQUE(workspace_id, email)

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
  start_date: date (NOT NULL)
  end_date: date (NOT NULL)
  holidays: text[] (default '{}')
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
  jira_epic_id: text (nullable)
  jira_epic_key: text (nullable)
  jira_url: text (nullable)
  story_points: numeric (nullable)
  size_override: boolean (default false)
  last_synced_at: timestamptz (nullable)
  created_at: timestamptz
  updated_at: timestamptz

jira_connections
  id: uuid PK
  workspace_id: uuid FK -> workspaces (ON DELETE CASCADE, UNIQUE)
  atlassian_cloud_id: text
  atlassian_site_url: text
  access_token: text
  refresh_token: text
  token_expires_at: timestamptz
  scopes: text[] (default '{}')
  connected_by: uuid FK -> auth.users
  created_at: timestamptz
  updated_at: timestamptz

jira_team_mappings
  id: uuid PK
  team_id: uuid FK -> teams (ON DELETE CASCADE, UNIQUE)
  jira_project_key: text (nullable)
  jira_filter_jql: text (nullable)
  epic_issue_type: text (default 'Epic')
  last_synced_at: timestamptz (nullable)
  sync_status: text ('idle' | 'syncing' | 'error', default 'idle')
  sync_error: text (nullable)
  auto_sync_enabled: boolean (default false)
  created_at: timestamptz
  updated_at: timestamptz

jira_stories
  id: uuid PK
  epic_id: uuid FK -> epics (ON DELETE CASCADE)
  jira_issue_id: text
  jira_issue_key: text (UNIQUE)
  title: text
  status: text
  status_category: text ('new' | 'indeterminate' | 'done')
  assignee: text (nullable)
  story_points: numeric (nullable)
  issue_type: text
  jira_url: text
  created_at: timestamptz
  updated_at: timestamptz
```

### Row Level Security

**Lesson learned**: The V1 implementation required 7 migration files to fix recursive RLS policies on `team_members`. The recursion happened because access to `teams` depended on `team_members`, which depended on `teams`.

**Strategy for the rewrite**:
- Gate access at the **workspace level only**. Use `workspace_members` to determine access. This table has a simple, non-recursive check: `user_id = auth.uid()`.
- All other tables derive access through their `team.workspace_id` path, using **security-definer functions** to avoid RLS recursion.

```sql
-- Helper functions (SECURITY DEFINER to bypass RLS)
CREATE FUNCTION user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = user_uuid;
$$;

CREATE FUNCTION user_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT id FROM teams WHERE workspace_id IN (SELECT user_workspace_ids(user_uuid));
$$;

CREATE FUNCTION user_quarter_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT id FROM quarters WHERE team_id IN (SELECT user_team_ids(user_uuid));
$$;
```

Additional RPCs for workspace management:
- `accept_pending_invites()` — auto-accepts pending invites matching the current user's email on sign-up
- `get_workspace_members_with_email(ws_id)` — joins workspace members with `auth.users` to return emails

**Admin client**: Server actions that need to bypass RLS (e.g., adding workspace members, querying `auth.users` by email) use `createAdminClient()` with the `SUPABASE_SERVICE_ROLE_KEY`. Only used in server actions, never exposed to the client.

### Indexes

```sql
CREATE INDEX idx_epics_team_quarter ON epics(team_id, quarter_id);
CREATE INDEX idx_quarters_team ON quarters(team_id);
CREATE INDEX idx_planning_members_team ON planning_members(team_id);
CREATE INDEX idx_quarter_members_quarter ON quarter_members(quarter_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX idx_jira_stories_epic ON jira_stories(epic_id);
```

---

## 9. Technology Stack

### Chosen based on V1 experience

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | API routes + SSR + React 19 in one package. |
| Language | TypeScript | Non-negotiable for a data-heavy app. |
| Database | Supabase (PostgreSQL) | Auth + DB + realtime in one service. V1 validated this choice. |
| Auth | Supabase Auth (Google OAuth + email) | Avoids rolling custom auth. |
| Drag & Drop | @dnd-kit | Worked well in V1 once IDs were disambiguated. |
| Styling | Tailwind CSS 4 | Replaces raw CSS3 from V1 for faster development and consistency. |
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

### Component structure

```
app/
  layout.tsx                    # Root layout with theme script
  page.tsx                      # Landing / redirect to dashboard
  login/
    page.tsx                    # Login page
    actions.ts                  # Server actions: login, signup, signOut, loginWithGoogle
  auth/callback/route.ts        # OAuth callback handler
  api/jira/
    authorize/route.ts          # Jira OAuth initiation
    callback/route.ts           # Jira OAuth callback
    sync/route.ts               # Manual Jira sync trigger
    disconnect/route.ts         # Jira disconnect
    projects/route.ts           # Fetch available Jira projects
  api/cron/jira-sync/route.ts   # Scheduled Jira sync endpoint
  dashboard/
    page.tsx                    # Server component: auth + workspace fetch
    actions.ts                  # Server actions: invite, remove member, rename workspace
    sign-out-button.tsx         # Sign-out form action
    components/
      DashboardClient.tsx       # Client-side orchestrator (wires hooks + UI)
      PlanningBoard.tsx         # DndContext wrapper, two-panel layout
      BacklogPanel.tsx          # Left panel
      QuarterCard.tsx           # Single quarter (collapsed or expanded)
      EpicCard.tsx              # Single epic card with drag handle
      EpicFormModal.tsx         # Create/edit epic
      QuarterFormModal.tsx      # Create/edit quarter
      CapacityBar.tsx           # Capacity visualization
      TeamSettingsModal.tsx     # Team settings, planning members, export, Jira config
      QuarterMembersModal.tsx   # Per-quarter vacation day editor
      CreateTeamForm.tsx        # New team creation
      WorkspaceSwitcher.tsx     # Multi-workspace dropdown
      WorkspaceMembersModal.tsx # Invite/remove workspace members
      Modal.tsx                 # Base portal modal with focus trapping
      JiraSettingsModal.tsx     # Jira connection and team mapping config
      JiraSyncButton.tsx        # Manual sync trigger with status
      JiraProjectPicker.tsx     # Jira project dropdown
      EpicProgressBadge.tsx     # Jira story completion badge
      EpicStoriesModal.tsx      # Jira stories list for an epic
  components/
    ThemeProvider.tsx            # Three-mode theme context
    ThemeToggle.tsx              # Cycling monitor/sun/moon button
  lib/
    supabase/
      client.ts                 # Browser Supabase client
      server.ts                 # Server Supabase client (cookie-aware)
      middleware.ts              # Auth middleware helper
      admin.ts                  # Service-role client for privileged ops
    capacity.ts                 # Pure capacity calculation (14 unit tests)
    workingDays.ts              # Working days from dates minus holidays (13 unit tests)
    workspace.ts                # ensureWorkspace() for auto-creation on first sign-in
    types.ts                    # TypeScript types (flat, no embedded arrays)
    constants.ts                # T-shirt sizes, colors, team defaults, droppable IDs
  hooks/
    useTeams.ts                 # Team CRUD + switching
    usePlanningMembers.ts       # Planning member CRUD
    useQuarters.ts              # Quarter CRUD
    useEpics.ts                 # Epic CRUD + backlog
    useQuarterMembers.ts        # Per-quarter vacation days
    useTeamQuarterMembers.ts    # Batch capacity data for all quarters
    useWorkspaceInvites.ts      # Pending invites management
    useJiraConnection.ts        # Jira OAuth connection state
    useJiraTeamMapping.ts       # Jira team mapping CRUD
    useJiraStories.ts           # Jira stories for an epic
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
- Jira-synced epics show progress badges with story completion.

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
- Test coverage for: auth flow, team setup, epic CRUD, quarter CRUD, drag-and-drop, capacity calculations, working days calculation, persistence

---

## 13. Build Order

### Phase 1: Core single-team planner [COMPLETE]

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

### Phase 2: Shared team usage [COMPLETE]

1. Multiple teams per workspace with tab switching
2. Workspace member invites (email-based, 30-day expiry, auto-accept on sign-up)
3. Workspace member management (remove members, revoke invites)
4. Workspace switcher for multi-workspace users
5. Access control hardening (RLS helper functions, admin client pattern)

### Phase 3: Jira integration [COMPLETE]

1. Jira OAuth 2.0 with PKCE (connect/disconnect flow)
2. Team-level Jira project/JQL mapping configuration
3. One-way epic import from Jira
4. Story sync with status categorization and aggregation
5. Epic progress badges and stories modal
6. Auto-sync infrastructure (cron endpoint)

### Phase 4: Polish [IN PROGRESS]

- Dark/light/system theme toggle
- "Warm Studio" design system
- Loading skeletons
- Mobile responsiveness
- E2E tests (Playwright)
- Google Auth local testing

### Later, if needed

- Two-way Jira sync (write-back)
- Dependency management
- Audit history
- Comments on epics
- Quarter templates
- Advanced reporting

---

## 14. Success Criteria

The product is successful when a user can:

1. Sign in with Google or email/password
2. Land in their workspace with a team creation prompt
3. Create a team with planning members
4. Create two quarters with start/end dates and per-member vacation days
5. Create and prioritize epics
6. Drag epics into quarters and see capacity update correctly
7. Be prevented from over-allocating a quarter
8. Reload and find the same data persisted
9. Export their roadmap as JSON
10. Invite a colleague to their workspace and share planning data
11. Connect Jira and see epic stories synced with progress tracking
12. Switch between light and dark themes

---

## 15. Open Decisions

- Whether to support read-only users (viewers) or only editors
- Exact behavior when a planning member is removed from a team mid-quarter (cascade delete from quarter_members, or soft-delete?)
- Whether to implement two-way Jira sync (writing size/priority back to Jira)
- Role management UI for workspace members (infrastructure exists, UI not yet built)
