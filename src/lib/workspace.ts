import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function ensureWorkspace(existingClient?: SupabaseClient) {
  const supabase = existingClient ?? (await createClient());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if user already has a workspace
  const { data: existingMembership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (existingMembership) {
    return existingMembership.workspace_id;
  }

  // Create a new workspace — the DB trigger auto-creates the owner membership.
  // We cannot use .select() here because the SELECT RLS policy requires
  // workspace membership, which the AFTER INSERT trigger creates. The RETURNING
  // clause would fail before the trigger commits.
  const workspaceName =
    user.user_metadata?.full_name
      ? `${user.user_metadata.full_name}'s Workspace`
      : "My Workspace";

  const { error } = await supabase
    .from("workspaces")
    .insert({ name: workspaceName, created_by: user.id });

  if (error) {
    console.error("Failed to create workspace:", error);
    return null;
  }

  // Now the trigger has created the membership, so we can query it
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return membership?.workspace_id ?? null;
}
