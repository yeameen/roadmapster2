# Roadmapster — Product Requirements Document

## Overview

Roadmapster is a capacity-first quarterly planning tool for software teams. It helps product managers and engineering leads answer: **given our real team capacity, what work fits into upcoming quarters?**

The core experience is a two-panel planning board where users drag epics from a prioritized backlog into quarters and get immediate capacity feedback. Think sprint planning, but for quarterly roadmap decisions.

**Target users**: Product managers, engineering managers, and tech leads who own quarterly planning.

---

## User Journeys

### First-time user
1. Signs up with Google or email/password
2. A default workspace is auto-created for them
3. Sees a guided prompt to create their first team
4. Adds planning members (names of people on the team — these are capacity inputs, not app accounts)
5. Creates their first quarter with start/end dates
6. Creates epics in the backlog, drags them into the quarter
7. Sees capacity update in real time

### Returning user
1. Signs in, lands on their dashboard with their team's planning board
2. Reviews capacity across quarters, adjusts epic assignments
3. Manages team settings, vacation days, quarter dates

### Inviting a colleague
1. Opens workspace settings, invites a colleague by email
2. Colleague receives the invite, signs up, and automatically joins the workspace
3. Both users see the same team data

### Connecting Jira
1. Opens team settings, clicks "Connect Jira"
2. Completes Jira OAuth flow
3. Selects which Jira project to sync
4. Clicks "Sync now" — epics and their child stories are imported
5. Epic cards now show story completion progress (e.g., "3/5 done")

---

## Pages

### Login Page
- Email/password sign-in and sign-up forms
- "Sign in with Google" button
- Clean, centered layout

### Dashboard (main page after login)
- **Header**: Workspace name, team tabs for switching between teams, workspace switcher dropdown (if user belongs to multiple workspaces), theme toggle (light/dark/system), sign-out button
- **Two-panel layout**:
  - **Left panel — Backlog**: Prioritized list of unscheduled epics grouped by priority (P0 first, then P1, P2, P3). "Add Epic" button at top. Acts as a drop target to unschedule epics.
  - **Right panel — Quarters**: Vertically stacked quarter cards. "Create Quarter" button at top. Each quarter can be collapsed or expanded.

### No teams state
- When a user has no teams yet, show a team creation form instead of the planning board

---

## Core Features

### Workspace Management
- Auto-created on first sign-up
- Workspace name is editable by the owner
- Invite members by email — invites are pending until the person signs up, then auto-accepted. Invites expire after 30 days.
- Remove members or revoke pending invites
- Users who belong to multiple workspaces can switch between them via a dropdown

### Team Management
- Create multiple teams within a workspace
- Switch between teams via tabs in the header
- Each team has configurable defaults:
  - Buffer percentage (default: 20%) — reserved capacity for unplanned work
  - On-call people per sprint (default: 1)
  - Sprints per quarter (default: 6)
  - Default working days per quarter (default: 65)

### Planning Members
- Add people to a team by name (these are capacity inputs, not user accounts)
- Optional skills field per member
- Members are counted in capacity calculations
- Their vacation days are set **per quarter**, not globally

### Quarter Management
- Create quarters with a name (e.g., "Q2 2026"), start date, and end date
- Status field: "Planning", "Active", or "Completed" (user-editable dropdown)
- Optional holidays list (specific dates excluded from working days)
- Working days auto-calculated from the date range minus weekends and holidays
- Per-quarter member availability: set vacation days for each planning member per quarter. Defaults to 0 for all members when a quarter is created.
- Quarters are collapsible on the board — collapsed view shows name, status, capacity percentage, and epic count
- Deleting a quarter returns all its epics to the backlog

### Epic Management
- Create epics with: title (required), size (required), priority (required), description (optional), owner name (optional free text)
- **Sizes**: XS, S, M, L, XL — mapped to effort in days: XS=5, S=10, M=20, L=40, XL=60
- **Priorities**: P0, P1, P2, P3
- Epics live in the backlog until assigned to a quarter
- Reorder epics within the backlog or within a quarter

### Drag-and-Drop Planning
- Drag epics from backlog into a quarter
- Drag epics between quarters
- Drag epics from a quarter back to the backlog
- Reorder epics within any container
- Each epic card has a dedicated **drag handle** (grip icon) — clicking elsewhere on the card opens the edit modal
- Capacity is checked before a drop is accepted. If the epic would exceed the quarter's capacity, reject the drop with a clear warning message.

### Capacity Calculation
For each quarter, capacity is calculated as:

1. For each planning member: available days = quarter working days minus that member's vacation days
2. Sum all members' available days = total available
3. Subtract on-call load: on-call people per sprint x sprints per quarter x 10 days
4. Subtract buffer: remaining x buffer percentage
5. Result = **final capacity** (available days for planned work)

**Capacity bar per quarter**:
- Shows "X / Y days (Z%)" with a colored progress bar
- Green when under 75% utilized
- Amber between 75-90%
- Red above 90%

Capacity updates immediately when epics are created, edited, moved, or deleted.

### Jira Integration (One-Way Import)
- Connect a Jira Cloud account via OAuth (one connection per workspace)
- Map a team to a Jira project or custom JQL filter
- Configure the epic issue type (default: "Epic")
- Sync epics and their child stories from Jira into Roadmapster
- Synced epics show: Jira key, link to Jira, story points
- Story points are auto-mapped to t-shirt sizes (user can override)
- Each synced epic shows a **progress badge** with story completion (e.g., "3/5 done")
- Clicking the progress badge opens a modal listing all child stories with: key, title, status, assignee, story points
- Story statuses are categorized as: new, in progress, or done
- Manual "Sync now" button plus auto-sync toggle for scheduled background syncing
- Sync status shown per team: idle, syncing, or error with message
- Disconnect option removes the Jira connection
- **This is read-only** — no data is written back to Jira

### Data Export
- Export a team's full roadmap as a JSON file from the team settings
- Includes: team settings, members, all quarters with assigned epics, backlog epics
- Filename format: `{team-name}-roadmap-{date}.json`

### Theme
- Three-mode toggle: system (follows OS), light, dark
- Persists the user's choice across sessions
- No flash of wrong theme on page load

---

## Design Guidelines

**Visual style**: Warm, professional, minimal. Not cold/corporate and not playful.

- **Color palette**: Warm grays as the base (stone tones), with amber/gold as the accent color
- **Cards**: Generously rounded corners, subtle warm-toned shadows
- **Buttons and inputs**: Rounded, with clear hover/focus states
- **Text on amber backgrounds**: Use dark text (not white) for accessibility
- **Status badges**: Planning = amber, Active = green, Completed = muted gray
- **Size badges on epic cards**: Color-coded by size — XS = blue, S = cyan, M = purple, L = orange, XL = red
- **Typography**: Clean sans-serif, clear hierarchy between headings, labels, and body text
- **Spacing**: Comfortable whitespace, not cramped

**Modals**: Used for creating/editing epics, quarters, team settings, member vacation days, workspace members, and Jira configuration. Modals close on Escape key or clicking the backdrop. Background content should be inert while a modal is open.

**Destructive actions** (delete epic, delete quarter, remove member): Require a confirmation dialog before proceeding.

**Empty states**: When the backlog is empty, prompt the user to add their first epic. When a quarter has no epics, show an invitation to drop epics. When there are no teams, show a team creation form.

**Loading states**: Show skeleton placeholders while data is loading on initial page load.

---

## Business Rules and Constraints

1. **Capacity enforcement**: Dropping an epic into a quarter that would exceed its capacity must be rejected with a visible warning. The epic stays where it was.
2. **Planning members are not users**: They are names in a capacity model. They don't sign in. They don't have accounts. A team of 8 engineers is modeled as 8 planning members, not 8 app users.
3. **Vacation days are per quarter**: The same person might have 0 vacation days in Q1 and 15 in Q2. This is configured per quarter, not globally on the member.
4. **Working days are derived**: Working days = weekdays between start and end date, minus holidays. Users can still override the calculated value.
5. **One Jira connection per workspace**: A workspace connects to one Jira Cloud site. Each team within the workspace can map to a different Jira project.
6. **Jira sync is one-way**: Data flows from Jira into Roadmapster only. No changes are pushed back to Jira.
7. **Invite auto-accept**: When a user signs up with an email that has a pending workspace invite, they automatically join that workspace instead of getting a new empty one.
8. **Workspace-scoped data**: All teams, quarters, epics, and members are scoped to a workspace. Users can only see data from workspaces they belong to.
9. **Cascade on delete**: Deleting a team removes all its quarters, epics, and planning members. Deleting a quarter moves its epics back to the backlog (sets their quarter to null).
10. **Invite expiry**: Workspace invites expire after 30 days if not accepted.

---

## Authentication

- Email/password sign-up and sign-in
- Google OAuth sign-in
- On first sign-up: check for pending workspace invites matching the user's email. If found, auto-accept and join that workspace. Otherwise, create a new default workspace.
- All pages except login require authentication. Unauthenticated users are redirected to login.
- Workspace membership determines data access. A user can only see data in workspaces they belong to.
- Workspace members have roles: owner, admin, member (role management UI is a future enhancement — all members currently have full edit access)

---

## Data Relationships

- A **workspace** has many **teams** and many **workspace members**
- A **workspace** has many **workspace invites** (pending email invitations)
- A **workspace** has at most one **Jira connection**
- A **team** has many **planning members**, **quarters**, and **epics**
- A **team** has at most one **Jira team mapping** (which Jira project to sync)
- A **quarter** has many **quarter-member records** (one per planning member, storing vacation days)
- A **quarter** has many **epics** assigned to it
- An **epic** belongs to at most one quarter (null = backlog)
- An **epic** can have many **Jira stories** (child issues synced from Jira)

---

## Non-Functional Requirements

- Desktop-first with usable tablet support
- Fast initial load (under 2 seconds for a typical team with 50 epics and 4 quarters)
- Drag-and-drop must feel instant (under 100ms response)
- Data must persist reliably — no loss on reload or across devices
- Optimistic UI updates for snappy interactions, with error recovery if the save fails
