import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { workspaceId?: string };
  const workspaceId = body.workspaceId;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Get team IDs for this workspace so we can delete their mappings
  const { data: teams } = await admin
    .from("teams")
    .select("id")
    .eq("workspace_id", workspaceId);

  if (teams && teams.length > 0) {
    const teamIds = teams.map((t: { id: string }) => t.id);
    const { error: mappingsError } = await admin
      .from("jira_team_mappings")
      .delete()
      .in("team_id", teamIds);

    if (mappingsError) {
      console.error("Failed to delete Jira team mappings:", mappingsError);
      return NextResponse.json(
        { error: "Failed to delete team mappings" },
        { status: 500 }
      );
    }
  }

  // Delete the connection
  const { error: deleteError } = await admin
    .from("jira_connections")
    .delete()
    .eq("workspace_id", workspaceId);

  if (deleteError) {
    console.error("Failed to delete Jira connection:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
