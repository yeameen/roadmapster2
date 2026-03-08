"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Quarter } from "@/lib/types";

export function useQuarters(teamId: string | null) {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchQuarters = useCallback(async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("quarters")
      .select("*")
      .eq("team_id", teamId)
      .order("display_order", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setQuarters(data ?? []);
    }
    setLoading(false);
  }, [teamId, supabase]);

  useEffect(() => {
    fetchQuarters();
  }, [fetchQuarters]);

  const createQuarter = useCallback(
    async (fields: { name: string; working_days: number; start_date: string; end_date: string; holidays?: string[] }) => {
      if (!teamId) return null;

      const nextOrder = quarters.length > 0
        ? Math.max(...quarters.map((q) => q.display_order)) + 1
        : 0;

      const { error: insertError } = await supabase.from("quarters").insert({
        team_id: teamId,
        name: fields.name,
        working_days: fields.working_days,
        start_date: fields.start_date,
        end_date: fields.end_date,
        holidays: fields.holidays ?? [],
        display_order: nextOrder,
        status: "planning",
      });

      if (insertError) {
        setError(insertError.message);
        return null;
      }

      await fetchQuarters();
      return true;
    },
    [teamId, quarters, supabase, fetchQuarters]
  );

  const updateQuarter = useCallback(
    async (id: string, updates: Partial<Pick<Quarter, "name" | "status" | "working_days" | "start_date" | "end_date" | "holidays" | "display_order">>) => {
      setQuarters((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
      );

      const { error: updateError } = await supabase
        .from("quarters")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
        await fetchQuarters();
      }
    },
    [supabase, fetchQuarters]
  );

  const deleteQuarter = useCallback(
    async (id: string) => {
      setQuarters((prev) => prev.filter((q) => q.id !== id));

      const { error: deleteError } = await supabase
        .from("quarters")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        await fetchQuarters();
      }
    },
    [supabase, fetchQuarters]
  );

  return { quarters, loading, error, createQuarter, updateQuarter, deleteQuarter, refetch: fetchQuarters };
}
