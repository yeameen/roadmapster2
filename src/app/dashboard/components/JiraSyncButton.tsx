"use client";

import { useState } from "react";
import { RefreshCw, Loader2, AlertCircle, Check } from "lucide-react";
import type { JiraTeamMapping } from "@/lib/types";

type Props = {
  teamId: string;
  mapping: JiraTeamMapping | null;
};

type SyncState = "idle" | "syncing" | "success" | "error";

export function JiraSyncButton({ teamId, mapping }: Props) {
  const [syncState, setSyncState] = useState<SyncState>("idle");

  if (!mapping) return null;

  async function handleSync() {
    setSyncState("syncing");

    try {
      const res = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Sync failed (${res.status})`);
      }

      setSyncState("success");
      // Reset to idle after showing success
      setTimeout(() => setSyncState("idle"), 2000);
    } catch {
      setSyncState("error");
      // Reset to idle after showing error
      setTimeout(() => setSyncState("idle"), 4000);
    }
  }

  const lastSynced = mapping.last_synced_at
    ? formatRelativeTime(new Date(mapping.last_synced_at))
    : null;

  return (
    <button
      onClick={handleSync}
      disabled={syncState === "syncing"}
      title={lastSynced ? `Last synced: ${lastSynced}` : "Sync with Jira"}
      className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        syncState === "error"
          ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : syncState === "success"
            ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400"
            : "border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
      }`}
    >
      {syncState === "syncing" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : syncState === "success" ? (
        <Check className="h-4 w-4" />
      ) : syncState === "error" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {syncState === "syncing"
        ? "Syncing..."
        : syncState === "success"
          ? "Synced"
          : syncState === "error"
            ? "Sync Error"
            : "Jira Sync"}
    </button>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
