"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";
import { TEAM_DEFAULTS } from "@/lib/constants";

export function useTeam(workspaceId: string | null) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeam = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("teams")
      .select("*")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      setError(fetchError.message);
    }
    setTeam(data);
    setLoading(false);
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const createTeam = useCallback(
    async (name: string) => {
      if (!workspaceId) return null;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { error: insertError } = await supabase.from("teams").insert({
        workspace_id: workspaceId,
        name,
        buffer_percentage: TEAM_DEFAULTS.BUFFER_PERCENTAGE,
        oncall_per_sprint: TEAM_DEFAULTS.ONCALL_PER_SPRINT,
        sprints_per_quarter: TEAM_DEFAULTS.SPRINTS_PER_QUARTER,
        default_working_days: TEAM_DEFAULTS.WORKING_DAYS,
        created_by: user.id,
      });

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      await fetchTeam();
      return team;
    },
    [workspaceId, supabase, fetchTeam, team]
  );

  const updateTeam = useCallback(
    async (updates: Partial<Pick<Team, "name" | "buffer_percentage" | "oncall_per_sprint" | "sprints_per_quarter" | "default_working_days">>) => {
      if (!team) return;

      // Optimistic update
      setTeam({ ...team, ...updates });

      const { error: updateError } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", team.id);

      if (updateError) {
        setError(updateError.message);
        await fetchTeam(); // Revert on error
      }
    },
    [team, supabase, fetchTeam]
  );

  return { team, loading, error, createTeam, updateTeam, refetch: fetchTeam };
}
