"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlanningMember } from "@/lib/types";

export function usePlanningMembers(teamId: string | null) {
  const [members, setMembers] = useState<PlanningMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("planning_members")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, [teamId, supabase]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = useCallback(
    async (name: string, skills: string[] = []) => {
      if (!teamId) return null;

      const { error: insertError } = await supabase
        .from("planning_members")
        .insert({ team_id: teamId, name, skills });

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      await fetchMembers();
      return true;
    },
    [teamId, supabase, fetchMembers]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<Pick<PlanningMember, "name" | "skills">>) => {
      // Optimistic update
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );

      const { error: updateError } = await supabase
        .from("planning_members")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        await fetchMembers();
      }
    },
    [supabase, fetchMembers]
  );

  const removeMember = useCallback(
    async (id: string) => {
      // Optimistic removal
      setMembers((prev) => prev.filter((m) => m.id !== id));

      const { error: deleteError } = await supabase
        .from("planning_members")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        await fetchMembers();
      }
    },
    [supabase, fetchMembers]
  );

  return { members, loading, error, addMember, updateMember, removeMember, refetch: fetchMembers };
}
