"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JiraStory } from "@/lib/types";

export function useJiraStories(epicId: string | null) {
  const [stories, setStories] = useState<JiraStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchStories = useCallback(async () => {
    if (!epicId) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("jira_stories")
      .select("*")
      .eq("epic_id", epicId)
      .order("created_at");

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setStories(data ?? []);
    }
    setLoading(false);
  }, [epicId, supabase]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const aggregation = useMemo(() => {
    const totalStories = stories.length;
    const doneStories = stories.filter(
      (s) => s.status_category === "done"
    ).length;
    const totalPoints = stories.reduce(
      (sum, s) => sum + (s.story_points ?? 0),
      0
    );
    const donePoints = stories
      .filter((s) => s.status_category === "done")
      .reduce((sum, s) => sum + (s.story_points ?? 0), 0);

    return { totalStories, doneStories, totalPoints, donePoints };
  }, [stories]);

  return { stories, loading, error, aggregation, refetch: fetchStories };
}
