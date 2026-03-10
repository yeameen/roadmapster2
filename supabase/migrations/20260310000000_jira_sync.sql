-- Jira sync schema
-- Adds tables for Jira OAuth connections, team mappings, and child stories.
-- Extends epics with Jira-sourced fields.

-- ============================================================================
-- New columns on epics
-- ============================================================================

ALTER TABLE epics
  ADD COLUMN jira_epic_id text,
  ADD COLUMN jira_epic_key text,
  ADD COLUMN jira_url text,
  ADD COLUMN story_points numeric,
  ADD COLUMN size_override boolean NOT NULL DEFAULT false,
  ADD COLUMN last_synced_at timestamptz;

CREATE UNIQUE INDEX idx_epics_jira_epic_key ON epics (jira_epic_key) WHERE jira_epic_key IS NOT NULL;

-- ============================================================================
-- jira_connections (one per workspace)
-- ============================================================================

CREATE TABLE jira_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  atlassian_cloud_id text NOT NULL,
  atlassian_site_url text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  connected_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON jira_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- jira_team_mappings (one per team)
-- ============================================================================

CREATE TABLE jira_team_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  jira_project_key text,
  jira_filter_jql text,
  epic_issue_type text NOT NULL DEFAULT 'Epic',
  last_synced_at timestamptz,
  sync_status text NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  sync_error text,
  auto_sync_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON jira_team_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- jira_stories (child issues under synced epics)
-- ============================================================================

CREATE TABLE jira_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  epic_id uuid NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  jira_issue_id text NOT NULL,
  jira_issue_key text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL,
  status_category text NOT NULL CHECK (status_category IN ('new', 'indeterminate', 'done')),
  assignee text,
  story_points numeric,
  issue_type text NOT NULL,
  jira_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_jira_stories_epic ON jira_stories(epic_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON jira_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE jira_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_team_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_stories ENABLE ROW LEVEL SECURITY;

-- jira_connections: workspace members can read; only the admin client writes
CREATE POLICY jira_connections_select ON jira_connections FOR SELECT
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY jira_connections_insert ON jira_connections FOR INSERT
  WITH CHECK (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY jira_connections_update ON jira_connections FOR UPDATE
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

CREATE POLICY jira_connections_delete ON jira_connections FOR DELETE
  USING (workspace_id IN (SELECT user_workspace_ids(auth.uid())));

-- jira_team_mappings: team members can CRUD
CREATE POLICY jira_team_mappings_select ON jira_team_mappings FOR SELECT
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY jira_team_mappings_insert ON jira_team_mappings FOR INSERT
  WITH CHECK (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY jira_team_mappings_update ON jira_team_mappings FOR UPDATE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

CREATE POLICY jira_team_mappings_delete ON jira_team_mappings FOR DELETE
  USING (team_id IN (SELECT user_team_ids(auth.uid())));

-- jira_stories: readable via epic->team chain; writes happen via admin client (sync)
CREATE POLICY jira_stories_select ON jira_stories FOR SELECT
  USING (epic_id IN (
    SELECT id FROM epics WHERE team_id IN (SELECT user_team_ids(auth.uid()))
  ));
