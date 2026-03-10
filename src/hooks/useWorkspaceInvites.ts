"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceInvite, WorkspaceMemberWithEmail } from "@/lib/types";

export function useWorkspaceInvites(workspaceId: string | null) {
  const [invites, setInvites] = useState<WorkspaceInvite[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setError(null);

    const [invitesResult, membersResult] = await Promise.all([
      supabase
        .from("workspace_invites")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_workspace_members_with_email", { ws_id: workspaceId }),
    ]);

    if (invitesResult.error && membersResult.error) {
      setError("Failed to load workspace data. The invite system may not be set up yet.");
    } else if (membersResult.error) {
      setError("Failed to load members. The workspace members function may not be available.");
    }

    if (invitesResult.data) setInvites(invitesResult.data);
    if (membersResult.data) setMembers(membersResult.data);
    setLoading(false);
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));

      const { error } = await supabase
        .from("workspace_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) {
        await fetchData();
      }
    },
    [supabase, fetchData]
  );

  return { invites, members, loading, error, revokeInvite, refetch: fetchData };
}
