export type Workspace = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
};

export type Team = {
  id: string;
  workspace_id: string;
  name: string;
  buffer_percentage: number;
  oncall_per_sprint: number;
  sprints_per_quarter: number;
  default_working_days: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PlanningMember = {
  id: string;
  team_id: string;
  name: string;
  skills: string[];
  created_at: string;
  updated_at: string;
};

export type QuarterStatus = "planning" | "active" | "completed";

export type Quarter = {
  id: string;
  team_id: string;
  name: string;
  status: QuarterStatus;
  working_days: number;
  start_date: string;
  end_date: string;
  holidays: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type QuarterMember = {
  id: string;
  quarter_id: string;
  planning_member_id: string;
  vacation_days: number;
};

export type EpicSize = "XS" | "S" | "M" | "L" | "XL";
export type EpicPriority = "P0" | "P1" | "P2" | "P3";

export type Epic = {
  id: string;
  team_id: string;
  title: string;
  description: string | null;
  size: EpicSize;
  priority: EpicPriority;
  quarter_id: string | null;
  position: number;
  owner: string | null;
  jira_epic_id: string | null;
  jira_epic_key: string | null;
  jira_url: string | null;
  story_points: number | null;
  size_override: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JiraStatusCategory = "new" | "indeterminate" | "done";

export type JiraConnection = {
  id: string;
  workspace_id: string;
  atlassian_cloud_id: string;
  atlassian_site_url: string;
  token_expires_at: string;
  scopes: string[];
  connected_by: string;
  created_at: string;
  updated_at: string;
};

export type JiraSyncStatus = "idle" | "syncing" | "error";

export type JiraTeamMapping = {
  id: string;
  team_id: string;
  jira_project_key: string | null;
  jira_filter_jql: string | null;
  epic_issue_type: string;
  last_synced_at: string | null;
  sync_status: JiraSyncStatus;
  sync_error: string | null;
  auto_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type JiraStory = {
  id: string;
  epic_id: string;
  jira_issue_id: string;
  jira_issue_key: string;
  title: string;
  status: string;
  status_category: JiraStatusCategory;
  assignee: string | null;
  story_points: number | null;
  issue_type: string;
  jira_url: string;
  created_at: string;
  updated_at: string;
};

export type InviteStatus = "pending" | "accepted" | "revoked";

export type WorkspaceInvite = {
  id: string;
  workspace_id: string;
  email: string;
  invited_by: string;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
};

export type WorkspaceMemberWithEmail = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  email: string;
  created_at: string;
};

export type CapacityResult = {
  totalAvailable: number;
  oncallLoad: number;
  afterOncall: number;
  buffer: number;
  finalCapacity: number;
  usedCapacity: number;
  remaining: number;
  utilization: number;
};
