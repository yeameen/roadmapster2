"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function inviteToWorkspace(workspaceId: string, email: string) {
  const supabase = await createClient();

  // Verify the calling user is owner/admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Only workspace owners can invite members");
  }

  // Check if already a member
  const admin = createAdminClient();
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const invitedUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (invitedUser) {
    // Check if already a workspace member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", invitedUser.id)
      .single();

    if (existingMember) {
      return { status: "already_member" as const, email };
    }

    // User exists — add them directly as a member (bypass RLS with admin client)
    const { error: memberError } = await admin
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: invitedUser.id,
        role: "member",
      });

    if (memberError) throw new Error(memberError.message);

    // Also create an invite record marked as accepted (for audit trail)
    await supabase.from("workspace_invites").upsert(
      {
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        invited_by: user.id,
        status: "accepted",
      },
      { onConflict: "workspace_id,email" }
    );

    return { status: "added" as const, email };
  }

  // User doesn't exist yet — create a pending invite
  const { error: inviteError } = await supabase.from("workspace_invites").upsert(
    {
      workspace_id: workspaceId,
      email: email.toLowerCase(),
      invited_by: user.id,
      status: "pending",
    },
    { onConflict: "workspace_id,email" }
  );

  if (inviteError) throw new Error(inviteError.message);

  return { status: "invited" as const, email };
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId);

  if (error) throw new Error(error.message);
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
