import type { EpicSize, EpicPriority, QuarterStatus, JiraStatusCategory } from "./types";

export const SIZE_COLORS: Record<EpicSize, string> = {
  XS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  S: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  M: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  L: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  XL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export const STATUS_COLORS: Record<QuarterStatus, string> = {
  planning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  completed: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

export const SIZE_TO_DAYS: Record<EpicSize, number> = {
  XS: 5,
  S: 10,
  M: 20,
  L: 40,
  XL: 60,
};

export const SIZES: EpicSize[] = ["XS", "S", "M", "L", "XL"];

export const PRIORITIES: EpicPriority[] = ["P0", "P1", "P2", "P3"];

export const PRIORITY_LABELS: Record<EpicPriority, string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

export const CAPACITY_THRESHOLDS = {
  GREEN_MAX: 0.75,
  AMBER_MAX: 0.9,
} as const;

// NOTE: These defaults are duplicated in the SQL migration
// (supabase/migrations/20260307000000_initial_schema.sql). Keep both in sync.
export const TEAM_DEFAULTS = {
  BUFFER_PERCENTAGE: 0.2,
  ONCALL_PER_SPRINT: 1,
  SPRINTS_PER_QUARTER: 6,
  WORKING_DAYS: 65,
} as const;

export const DROPPABLE_IDS = {
  BACKLOG: "backlog",
  QUARTER_PREFIX: "quarter:",
  EPIC_PREFIX: "epic:",
} as const;

export const JIRA_STATUS_CATEGORY_COLORS: Record<JiraStatusCategory, string> = {
  new: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  indeterminate: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};
