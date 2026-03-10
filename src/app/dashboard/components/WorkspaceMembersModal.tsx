"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Trash2, Crown, Clock, Pencil, Check } from "lucide-react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useWorkspaceInvites } from "@/hooks/useWorkspaceInvites";
import { inviteToWorkspace, removeWorkspaceMember, renameWorkspace } from "@/app/dashboard/actions";
import type { WorkspaceMemberWithEmail } from "@/lib/types";

type Props = {
  workspaceId: string;
  workspaceName: string;
  currentUserId: string;
  userRole: "owner" | "admin" | "member";
  onClose: () => void;
};

export function WorkspaceMembersModal({ workspaceId, workspaceName, currentUserId, userRole, onClose }: Props) {
  const router = useRouter();
  const { invites, members, loading, error: fetchError, revokeInvite, refetch } = useWorkspaceInvites(workspaceId);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [removingMember, setRemovingMember] = useState<WorkspaceMemberWithEmail | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(workspaceName);
  const [savingName, setSavingName] = useState(false);

  const isOwner = userRole === "owner" || userRole === "admin";

  async function handleRename() {
    if (!nameValue.trim() || nameValue.trim() === workspaceName) {
      setEditingName(false);
      setNameValue(workspaceName);
      return;
    }
    setSavingName(true);
    try {
      await renameWorkspace(workspaceId, nameValue.trim());
      setEditingName(false);
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to rename" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setMessage(null);

    try {
      const result = await inviteToWorkspace(workspaceId, email.trim());
      if (result.status === "added") {
        setMessage({ type: "success", text: `${result.email} has been added to the workspace.` });
      } else if (result.status === "invited") {
        setMessage({ type: "success", text: `Invite sent to ${result.email}. They'll join when they sign up.` });
      } else {
        setMessage({ type: "error", text: `${result.email} is already a member.` });
      }
      setEmail("");
      await refetch();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send invite" });
    } finally {
      setSending(false);
    }
  }

  async function handleRemoveMember(member: WorkspaceMemberWithEmail) {
    try {
      await removeWorkspaceMember(workspaceId, member.user_id);
      await refetch();
      setRemovingMember(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove member" });
      setRemovingMember(null);
    }
  }

  return (
    <>
      <Modal onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Workspace Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Workspace name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Workspace name
            </label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") { setEditingName(false); setNameValue(workspaceName); }
                  }}
                  className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-1.5 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleRename}
                  disabled={savingName}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {savingName ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-900 dark:text-white">{workspaceName}</span>
                {isOwner && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label="Rename workspace"
                    title="Rename workspace"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Invite form — only for owners/admins */}
          {isOwner && (
            <form onSubmit={handleInvite} className="space-y-3">
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Invite by email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                  className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {sending ? "Sending..." : "Invite"}
                </button>
              </div>
            </form>
          )}

          {/* Status message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Fetch error */}
          {fetchError && (
            <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
              {fetchError}
            </div>
          )}

          {/* Current members */}
          <div>
            <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Members ({members.length})
            </h3>
            {loading ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
            ) : (
              <ul className="space-y-1">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm text-stone-900 dark:text-white">
                        {m.email}
                      </span>
                      {m.role === "owner" && (
                        <span className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          <Crown className="h-3 w-3" />
                          Owner
                        </span>
                      )}
                      {m.user_id === currentUserId && (
                        <span className="text-xs text-stone-400 dark:text-stone-500">(you)</span>
                      )}
                    </div>
                    {isOwner && m.user_id !== currentUserId && m.role !== "owner" && (
                      <button
                        onClick={() => setRemovingMember(m)}
                        className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Remove ${m.email}`}
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending invites */}
          {invites.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Pending Invites ({invites.length})
              </h3>
              <ul className="space-y-1">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-dashed border-stone-300 dark:border-stone-600 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm text-stone-500 dark:text-stone-400">
                        {inv.email}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => revokeInvite(inv.id)}
                        className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Revoke invite for ${inv.email}`}
                        title="Revoke invite"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-stone-200 dark:border-stone-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Close
          </button>
        </div>
      </Modal>

      {removingMember && (
        <ConfirmDialog
          title="Remove member"
          message={`Remove ${removingMember.email} from this workspace? They will lose access to all teams and data.`}
          onConfirm={() => handleRemoveMember(removingMember)}
          onCancel={() => setRemovingMember(null)}
        />
      )}
    </>
  );
}
