"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Team } from "@/lib/types";
import { TEAM_DEFAULTS } from "@/lib/constants";

export function useTeams(workspaceId: string | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTeams = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("teams")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    }
    setTeams(data ?? []);
    setLoading(false);
  }, [workspaceId, supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = useCallback(
    async (name: string): Promise<Team | null> => {
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

      // Query the newly created team by name (most recent)
      const { data: newTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("name", name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      await fetchTeams();
      return newTeam;
    },
    [workspaceId, supabase, fetchTeams]
  );

  const updateTeam = useCallback(
    async (teamId: string, updates: Partial<Pick<Team, "name" | "buffer_percentage" | "oncall_per_sprint" | "sprints_per_quarter" | "default_working_days">>) => {
      // Optimistic update
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...updates } : t)));

      const { error: updateError } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", teamId);

      if (updateError) {
        setError(updateError.message);
        await fetchTeams(); // Revert on error
      }
    },
    [supabase, fetchTeams]
  );

  return { teams, loading, error, createTeam, updateTeam, refetch: fetchTeams };
}
