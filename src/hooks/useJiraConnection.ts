"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JiraConnection } from "@/lib/types";

export function useJiraConnection(workspaceId: string | null) {
  const [connection, setConnection] = useState<JiraConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchConnection = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("jira_connections")
      .select(
        "id, workspace_id, atlassian_cloud_id, atlassian_site_url, token_expires_at, scopes, connected_by, created_at, updated_at"
      )
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setConnection(data);
    }
    setLoading(false);
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  return { connection, loading, error, refetch: fetchConnection };
}
