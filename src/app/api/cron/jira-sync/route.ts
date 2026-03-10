import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncTeamFromJira } from "@/lib/jira/sync";

export async function POST(request: Request) {
  // Validate cron secret
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // Get all mappings with auto-sync enabled
  const { data: mappings, error } = await admin
    .from("jira_team_mappings")
    .select("team_id")
    .eq("auto_sync_enabled", true);

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch mappings: ${error.message}` },
      { status: 500 }
    );
  }

  const results: {
    teamId: string;
    success: boolean;
    stats?: { created: number; updated: number; unlinked: number; stories: number };
    error?: string;
  }[] = [];

  // Process each team sequentially
  for (const mapping of mappings ?? []) {
    try {
      const stats = await syncTeamFromJira(mapping.team_id);
      results.push({
        teamId: mapping.team_id,
        success: true,
        stats,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        teamId: mapping.team_id,
        success: false,
        error: message,
      });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    total: results.length,
    succeeded,
    failed,
    results,
  });
}
