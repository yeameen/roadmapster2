"use client";

import { useState } from "react";
import {
  X,
  Link,
  RefreshCw,
  Unlink,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useJiraConnection } from "@/hooks/useJiraConnection";
import { useJiraTeamMapping } from "@/hooks/useJiraTeamMapping";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Modal } from "./Modal";
import { JiraProjectPicker } from "./JiraProjectPicker";

type Props = {
  workspaceId: string;
  teamId: string;
  teamName: string;
  onClose: () => void;
};

export function JiraSettingsModal({ workspaceId, teamId, teamName, onClose }: Props) {
  const { connection, loading: connLoading, refetch: refetchConnection } = useJiraConnection(workspaceId);
  const { mapping, loading: mapLoading, saveMapping, refetch: refetchMapping } = useJiraTeamMapping(teamId);

  if (connLoading || mapLoading) {
    return (
      <Modal onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Jira Integration</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400 dark:text-stone-500" />
        </div>
      </Modal>
    );
  }

  // State 1: Not connected
  if (!connection) {
    return (
      <Modal onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Jira Integration</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NotConnectedView workspaceId={workspaceId} />
      </Modal>
    );
  }

  // State 2: Connected, no mapping
  if (!mapping) {
    return (
      <Modal onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Jira Integration</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SetupMappingView
          workspaceId={workspaceId}
          teamName={teamName}
          siteUrl={connection.atlassian_site_url}
          onSave={async (fields) => {
            await saveMapping(fields);
          }}
          onClose={onClose}
        />
      </Modal>
    );
  }

  // State 3: Connected + mapped
  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Jira Integration</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <ConnectedView
        workspaceId={workspaceId}
        teamId={teamId}
        teamName={teamName}
        siteUrl={connection.atlassian_site_url}
        mapping={mapping}
        onSaveMapping={saveMapping}
        onRefetchMapping={refetchMapping}
        onRefetchConnection={refetchConnection}
        onClose={onClose}
      />
    </Modal>
  );
}

// --- Sub-views ---

function NotConnectedView({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
        <Link className="h-6 w-6 text-stone-400 dark:text-stone-500" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 dark:text-white">
        Connect to Jira
      </h3>
      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
        Import epics from Jira and keep your roadmap in sync.
      </p>
      <a
        href={`/api/jira/authorize?workspaceId=${workspaceId}`}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600"
      >
        <ExternalLink className="h-4 w-4" />
        Connect to Jira
      </a>
    </div>
  );
}

function SetupMappingView({
  workspaceId,
  teamName,
  siteUrl,
  onSave,
  onClose,
}: {
  workspaceId: string;
  teamName: string;
  siteUrl: string;
  onSave: (fields: { jira_project_key?: string | null; jira_filter_jql?: string | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const [jql, setJql] = useState("");
  const [saving, setSaving] = useState(false);
  const [useJql, setUseJql] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        jira_project_key: useJql ? null : projectKey,
        jira_filter_jql: useJql ? jql.trim() || null : null,
      });
      onClose();
    } catch {
      // Error is shown via hook
    } finally {
      setSaving(false);
    }
  }

  const canSave = useJql ? jql.trim().length > 0 : !!projectKey;

  return (
    <div className="px-6 py-4">
      {/* Connection info */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Connected to {siteUrl}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
        Map &ldquo;{teamName}&rdquo; to a Jira project
      </h3>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Choose which Jira project to sync epics from.
      </p>

      <div className="mt-4 space-y-4">
        {/* Toggle: Project vs JQL */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
            <input
              type="radio"
              checked={!useJql}
              onChange={() => setUseJql(false)}
              className="accent-amber-500"
            />
            Project
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
            <input
              type="radio"
              checked={useJql}
              onChange={() => setUseJql(true)}
              className="accent-amber-500"
            />
            Custom JQL
          </label>
        </div>

        {useJql ? (
          <div>
            <label htmlFor="jql" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              JQL Filter
            </label>
            <textarea
              id="jql"
              value={jql}
              onChange={(e) => setJql(e.target.value)}
              rows={3}
              placeholder='project = PROJ AND issuetype = Epic AND status != Done'
              className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Jira Project
            </label>
            <JiraProjectPicker
              workspaceId={workspaceId}
              value={projectKey}
              onChange={setProjectKey}
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-stone-200 dark:border-stone-700 pt-4">
        <button
          onClick={onClose}
          className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Mapping"}
        </button>
      </div>
    </div>
  );
}

function ConnectedView({
  workspaceId,
  teamId,
  teamName,
  siteUrl,
  mapping,
  onSaveMapping,
  onRefetchMapping,
  onRefetchConnection,
  onClose,
}: {
  workspaceId: string;
  teamId: string;
  teamName: string;
  siteUrl: string;
  mapping: NonNullable<ReturnType<typeof useJiraTeamMapping>["mapping"]>;
  onSaveMapping: (fields: {
    jira_project_key?: string | null;
    jira_filter_jql?: string | null;
    epic_issue_type?: string;
    auto_sync_enabled?: boolean;
  }) => Promise<void>;
  onRefetchMapping: () => Promise<void>;
  onRefetchConnection: () => Promise<void>;
  onClose: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
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
      await onRefetchMapping();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleAutoSync() {
    try {
      await onSaveMapping({ auto_sync_enabled: !mapping.auto_sync_enabled });
    } catch {
      // Error handled by hook
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/jira/disconnect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Disconnect failed (${res.status})`);
      }
      await onRefetchConnection();
      onClose();
    } catch {
      // Stay on modal if disconnect fails
    } finally {
      setDisconnecting(false);
      setConfirmDisconnect(false);
    }
  }

  if (editing) {
    return (
      <SetupMappingView
        workspaceId={workspaceId}
        teamName={teamName}
        siteUrl={siteUrl}
        onSave={async (fields) => {
          await onSaveMapping(fields);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    );
  }

  const lastSynced = mapping.last_synced_at
    ? formatRelativeTime(new Date(mapping.last_synced_at))
    : "Never";

  const mappingLabel = mapping.jira_project_key
    ? `Project: ${mapping.jira_project_key}`
    : mapping.jira_filter_jql
      ? "Custom JQL"
      : "Not configured";

  return (
    <div className="px-6 py-4">
      {/* Connection status */}
      <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Connected to {siteUrl}
        </span>
      </div>

      {/* Mapping info */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Mapping
            </p>
            <p className="text-sm font-medium text-stone-900 dark:text-white">{mappingLabel}</p>
            {mapping.jira_filter_jql && (
              <p className="mt-1 rounded-lg bg-stone-100 dark:bg-stone-800 px-2 py-1 text-xs font-mono text-stone-600 dark:text-stone-400 max-w-full truncate">
                {mapping.jira_filter_jql}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Edit Mapping
          </button>
        </div>

        {/* Last synced */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Last Synced
          </p>
          <p className="text-sm text-stone-900 dark:text-white">{lastSynced}</p>
        </div>

        {/* Sync status / error */}
        {(mapping.sync_status === "error" || mapping.sync_error || syncError) && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {syncError || mapping.sync_error || "Sync encountered an error"}
            </span>
          </div>
        )}

        {/* Auto-sync toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-white">Auto-sync</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Automatically sync epics from Jira
            </p>
          </div>
          <button
            role="switch"
            aria-checked={mapping.auto_sync_enabled}
            onClick={handleToggleAutoSync}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              mapping.auto_sync_enabled
                ? "bg-amber-500"
                : "bg-stone-300 dark:bg-stone-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                mapping.auto_sync_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-3 border-t border-stone-200 dark:border-stone-700 pt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? "Syncing..." : "Sync Now"}
          </button>

          <button
            onClick={() => setConfirmDisconnect(true)}
            disabled={disconnecting}
            className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Unlink className="h-4 w-4" />
            Disconnect
          </button>
        </div>

        {syncing && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            This may take a moment depending on the number of epics...
          </p>
        )}
      </div>

      {confirmDisconnect && (
        <ConfirmDialog
          title="Disconnect Jira"
          message="This will remove the Jira connection for this workspace. Synced epics will remain but will no longer update from Jira."
          confirmLabel="Disconnect"
          onConfirm={handleDisconnect}
          onCancel={() => setConfirmDisconnect(false)}
        />
      )}
    </div>
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
