import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncTeamFromJira } from "@/lib/jira/sync";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = (await request.json()) as { teamId?: string };
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the team (RLS will enforce this)
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 403 }
      );
    }

    // Run sync
    const stats = await syncTeamFromJira(teamId);

    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
