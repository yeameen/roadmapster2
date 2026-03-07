import type { EpicSize, EpicPriority } from "./types";

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
