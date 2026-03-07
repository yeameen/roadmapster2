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
  start_date: string | null;
  end_date: string | null;
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
  created_at: string;
  updated_at: string;
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
