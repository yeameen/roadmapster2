"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

type JiraProject = {
  key: string;
  name: string;
};

type Props = {
  workspaceId: string;
  value: string | null;
  onChange: (projectKey: string) => void;
};

export function JiraProjectPicker({ workspaceId, value, onChange }: Props) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/jira/projects?workspaceId=${workspaceId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load projects (${res.status})`);
      }
      const data: JiraProject[] = await res.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-stone-400 dark:text-stone-500" />
        <span className="text-sm text-stone-500 dark:text-stone-400">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2">
        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
        <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        <button
          onClick={fetchProjects}
          className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
    >
      <option value="">Select a project...</option>
      {projects.map((p) => (
        <option key={p.key} value={p.key}>
          {p.key} — {p.name}
        </option>
      ))}
    </select>
  );
}
