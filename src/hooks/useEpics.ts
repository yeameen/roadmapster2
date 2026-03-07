"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Epic, EpicSize, EpicPriority } from "@/lib/types";

export function useEpics(teamId: string | null) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchEpics = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("epics")
      .select("*")
      .eq("team_id", teamId)
      .order("position", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEpics(data ?? []);
    }
    setLoading(false);
  }, [teamId, supabase]);

  useEffect(() => {
    fetchEpics();
  }, [fetchEpics]);

  const createEpic = useCallback(
    async (fields: {
      title: string;
      size: EpicSize;
      priority: EpicPriority;
      description?: string;
      owner?: string;
      quarter_id?: string;
    }) => {
      if (!teamId) return null;

      const maxPosition = epics.length > 0
        ? Math.max(...epics.map((e) => e.position)) + 1
        : 0;

      const { error: insertError } = await supabase.from("epics").insert({
        team_id: teamId,
        title: fields.title,
        size: fields.size,
        priority: fields.priority,
        description: fields.description || null,
        owner: fields.owner || null,
        quarter_id: fields.quarter_id || null,
        position: maxPosition,
      });

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      await fetchEpics();
      return true;
    },
    [teamId, epics, supabase, fetchEpics]
  );

  const updateEpic = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Epic, "title" | "size" | "priority" | "description" | "owner" | "quarter_id" | "position">>
    ) => {
      setEpics((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
      );

      const { error: updateError } = await supabase
        .from("epics")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        await fetchEpics();
      }
    },
    [supabase, fetchEpics]
  );

  const deleteEpic = useCallback(
    async (id: string) => {
      setEpics((prev) => prev.filter((e) => e.id !== id));

      const { error: deleteError } = await supabase
        .from("epics")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        await fetchEpics();
      }
    },
    [supabase, fetchEpics]
  );

  return { epics, loading, error, createEpic, updateEpic, deleteEpic, refetch: fetchEpics };
}
