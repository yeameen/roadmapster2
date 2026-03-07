"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuarterMember } from "@/lib/types";

export function useQuarterMembers(quarterId: string | null) {
  const [quarterMembers, setQuarterMembers] = useState<QuarterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchQuarterMembers = useCallback(async () => {
    if (!quarterId) {
      setQuarterMembers([]);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("quarter_members")
      .select("*")
      .eq("quarter_id", quarterId);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setQuarterMembers(data ?? []);
    }
    setLoading(false);
  }, [quarterId, supabase]);

  useEffect(() => {
    fetchQuarterMembers();
  }, [fetchQuarterMembers]);

  const initializeMembers = useCallback(
    async (qId: string, planningMemberIds: string[]) => {
      const rows = planningMemberIds.map((pmId) => ({
        quarter_id: qId,
        planning_member_id: pmId,
        vacation_days: 0,
      }));

      const { error: insertError } = await supabase
        .from("quarter_members")
        .upsert(rows, { onConflict: "quarter_id,planning_member_id" });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Fetch directly using the passed qId instead of relying on
      // the potentially stale quarterId from the closure.
      const { data, error: fetchError } = await supabase
        .from("quarter_members")
        .select("*")
        .eq("quarter_id", qId);

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setQuarterMembers(data ?? []);
      }
    },
    [supabase]
  );

  const updateVacationDays = useCallback(
    async (quarterMemberId: string, vacationDays: number) => {
      setQuarterMembers((prev) =>
        prev.map((qm) =>
          qm.id === quarterMemberId
            ? { ...qm, vacation_days: vacationDays }
            : qm
        )
      );

      const { error: updateError } = await supabase
        .from("quarter_members")
        .update({ vacation_days: vacationDays })
        .eq("id", quarterMemberId);

      if (updateError) {
        setError(updateError.message);
        await fetchQuarterMembers();
      }
    },
    [supabase, fetchQuarterMembers]
  );

  return { quarterMembers, loading, error, initializeMembers, updateVacationDays, refetch: fetchQuarterMembers };
}
