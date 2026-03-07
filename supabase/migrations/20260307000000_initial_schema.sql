-- Roadmapster initial schema
-- Single migration covering all tables, RLS, indexes, and helper functions
--
-- NOTE: Default values for teams and quarters (buffer_percentage, oncall_per_sprint,
-- sprints_per_quarter, default_working_days) are duplicated in src/lib/constants.ts
-- (TEAM_DEFAULTS). Keep both in sync when changing defaults.

-- ============================================================================
-- Tables
-- ============================================================================

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  buffer_percentage numeric NOT NULL DEFAULT 0.2 CHECK (buffer_percentage >= 0 AND buffer_percentage <= 1),
  oncall_per_sprint integer NOT NULL DEFAULT 1,
  sprints_per_quarter integer NOT NULL DEFAULT 6,
  default_working_days integer NOT NULL DEFAULT 65,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE planning_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  working_days integer NOT NULL DEFAULT 65,
  start_date date,
  end_date date,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quarter_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter_id uuid NOT NULL REFERENCES quarters(id) ON DELETE CASCADE,
  planning_member_id uuid NOT NULL REFERENCES planning_members(id) ON DELETE CASCADE,
  vacation_days integer NOT NULL DEFAULT 0,
  UNIQUE(quarter_id, planning_member_id)
);

CREATE TABLE epics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  size text NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL')),
  priority text NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  quarter_id uuid REFERENCES quarters(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  owner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_teams_workspace ON teams(workspace_id);
CREATE INDEX idx_planning_members_team ON planning_members(team_id);
CREATE INDEX idx_quarters_team ON quarters(team_id);
CREATE INDEX idx_quarter_members_quarter ON quarter_members(quarter_id);
CREATE INDEX idx_epics_team_quarter ON epics(team_id, quarter_id);

-- ============================================================================
-- Updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON planning_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON quarters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON epics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Auto-create workspace owner membership on workspace creation
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION handle_new_workspace();

-- ============================================================================
-- RLS helper functions (SECURITY DEFINER to avoid recursive policy checks)
-- ============================================================================

CREATE OR REPLACE FUNCTION user_workspace_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION user_team_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT id FROM teams WHERE workspace_id IN (SELECT user_workspace_ids(user_uuid));
$$;

CREATE OR REPLACE FUNCTION user_quarter_ids(user_uuid uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT id FROM quarters WHERE team_id IN (SELECT user_team_ids(user_uuid));
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarter_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;

-- Workspaces: users can see workspaces they belong to
CREATE POLICY workspace_select ON workspaces FOR SELECT
  USING (id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY workspace_update ON workspaces FOR UPDATE
  USING (id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY workspace_insert ON workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Workspace members: any member can view, only owner/admin can add/remove
CREATE POLICY workspace_members_select ON workspace_members FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY workspace_members_insert ON workspace_members FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY workspace_members_delete ON workspace_members FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Teams: access via workspace membership
CREATE POLICY teams_select ON teams FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY teams_insert ON teams FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY teams_update ON teams FOR UPDATE
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY teams_delete ON teams FOR DELETE
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

-- Planning members: access via team -> workspace
CREATE POLICY planning_members_select ON planning_members FOR SELECT
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY planning_members_insert ON planning_members FOR INSERT
  WITH CHECK (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY planning_members_update ON planning_members FOR UPDATE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY planning_members_delete ON planning_members FOR DELETE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

-- Quarters: access via team -> workspace
CREATE POLICY quarters_select ON quarters FOR SELECT
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY quarters_insert ON quarters FOR INSERT
  WITH CHECK (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY quarters_update ON quarters FOR UPDATE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY quarters_delete ON quarters FOR DELETE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

-- Quarter members: access via quarter -> team -> workspace
CREATE POLICY quarter_members_select ON quarter_members FOR SELECT
  USING (quarter_id IN (SELECT user_quarter_ids(auth.uid())));

CREATE POLICY quarter_members_insert ON quarter_members FOR INSERT
  WITH CHECK (quarter_id IN (SELECT user_quarter_ids(auth.uid())));

CREATE POLICY quarter_members_update ON quarter_members FOR UPDATE
  USING (quarter_id IN (SELECT user_quarter_ids(auth.uid())));

CREATE POLICY quarter_members_delete ON quarter_members FOR DELETE
  USING (quarter_id IN (SELECT user_quarter_ids(auth.uid())));

-- Epics: access via team -> workspace
CREATE POLICY epics_select ON epics FOR SELECT
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY epics_insert ON epics FOR INSERT
  WITH CHECK (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY epics_update ON epics FOR UPDATE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY epics_delete ON epics FOR DELETE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));
