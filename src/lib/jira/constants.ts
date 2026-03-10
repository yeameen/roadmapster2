import type { EpicSize, EpicPriority } from "@/lib/types";

/** Points to t-shirt size auto-suggestion */
export function suggestSizeFromPoints(points: number | null): EpicSize {
  if (points === null) return "M";
  if (points <= 3) return "XS";
  if (points <= 8) return "S";
  if (points <= 13) return "M";
  if (points <= 21) return "L";
  return "XL";
}

/** Jira priority name to Roadmapster priority */
export function mapJiraPriority(jiraPriority: string | null): EpicPriority {
  if (!jiraPriority) return "P2";
  const name = jiraPriority.toLowerCase();
  if (name === "highest" || name === "critical") return "P0";
  if (name === "high") return "P1";
  if (name === "medium") return "P2";
  return "P3"; // Low, Lowest, etc.
}

/** Jira status category key to our enum */
export function mapStatusCategory(
  key: string
): "new" | "indeterminate" | "done" {
  if (key === "new") return "new";
  if (key === "done") return "done";
  return "indeterminate";
}
