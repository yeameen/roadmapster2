"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Modal } from "./Modal";
import type { Epic, EpicSize, EpicPriority } from "@/lib/types";
import { SIZES, PRIORITIES, SIZE_TO_DAYS, PRIORITY_LABELS } from "@/lib/constants";

type Props = {
  epic?: Epic;
  onClose: () => void;
  onSubmit: (fields: {
    title: string;
    size: EpicSize;
    priority: EpicPriority;
    description?: string;
    owner?: string;
  }) => Promise<void>;
};

export function EpicFormModal({ epic, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState(epic?.title ?? "");
  const [size, setSize] = useState<EpicSize>(epic?.size ?? "M");
  const [priority, setPriority] = useState<EpicPriority>(epic?.priority ?? "P1");
  const [description, setDescription] = useState(epic?.description ?? "");
  const [owner, setOwner] = useState(epic?.owner ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await onSubmit({
      title: title.trim(),
      size,
      priority,
      description: description.trim() || undefined,
      owner: owner.trim() || undefined,
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            {epic ? "Edit Epic" : "Add Epic"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="epic-title" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Title
              </label>
              <input
                id="epic-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Migrate auth to SSO"
                required
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="epic-size" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Size
                </label>
                <select
                  id="epic-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value as EpicSize)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} ({SIZE_TO_DAYS[s]}d)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="epic-priority" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Priority
                </label>
                <select
                  id="epic-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EpicPriority)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} — {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="epic-description" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Description
              </label>
              <textarea
                id="epic-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Optional description..."
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label htmlFor="epic-owner" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Owner
              </label>
              <input
                id="epic-owner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Optional owner name"
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : epic ? "Save" : "Add Epic"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
