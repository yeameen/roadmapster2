"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { QuarterMember } from "@/lib/types";

export function useTeamQuarterMembers(quarterIds: string[]) {
  const [quarterMembersMap, setQuarterMembersMap] = useState<Record<string, QuarterMember[]>>({});
  const supabase = createClient();
  const idsKey = quarterIds.join(",");

  const fetchAll = useCallback(async () => {
    if (quarterIds.length === 0) {
      setQuarterMembersMap({});
      return;
    }

    const { data, error } = await supabase
      .from("quarter_members")
      .select("*")
      .in("quarter_id", quarterIds);

    if (!error && data) {
      const map: Record<string, QuarterMember[]> = {};
      for (const qm of data) {
        if (!map[qm.quarter_id]) map[qm.quarter_id] = [];
        map[qm.quarter_id].push(qm);
      }
      setQuarterMembersMap(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { quarterMembersMap, refetch: fetchAll };
}
