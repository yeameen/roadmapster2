"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JiraTeamMapping } from "@/lib/types";

export function useJiraTeamMapping(teamId: string | null) {
  const [mapping, setMapping] = useState<JiraTeamMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMapping = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("jira_team_mappings")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMapping(data);
    }
    setLoading(false);
  }, [teamId, supabase]);

  useEffect(() => {
    fetchMapping();
  }, [fetchMapping]);

  const saveMapping = useCallback(
    async (fields: {
      jira_project_key?: string | null;
      jira_filter_jql?: string | null;
      epic_issue_type?: string;
      auto_sync_enabled?: boolean;
    }) => {
      if (!teamId) return;

      if (mapping) {
        // Update existing mapping
        setMapping((prev) => (prev ? { ...prev, ...fields } : prev));

        const { error: updateError } = await supabase
          .from("jira_team_mappings")
          .update(fields)
          .eq("id", mapping.id);

        if (updateError) {
          setError(updateError.message);
          await fetchMapping();
          throw new Error(updateError.message);
        }

        await fetchMapping();
      } else {
        // Insert new mapping
        const { error: insertError } = await supabase
          .from("jira_team_mappings")
          .insert({
            team_id: teamId,
            ...fields,
          });

        if (insertError) {
          setError(insertError.message);
          throw new Error(insertError.message);
        }

        await fetchMapping();
      }
    },
    [teamId, mapping, supabase, fetchMapping]
  );

  const deleteMapping = useCallback(async () => {
    if (!mapping) return;

    setMapping(null);

    const { error: deleteError } = await supabase
      .from("jira_team_mappings")
      .delete()
      .eq("id", mapping.id);

    if (deleteError) {
      setError(deleteError.message);
      await fetchMapping();
    }
  }, [mapping, supabase, fetchMapping]);

  return { mapping, loading, error, saveMapping, deleteMapping, refetch: fetchMapping };
}
