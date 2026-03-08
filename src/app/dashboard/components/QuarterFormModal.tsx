"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Modal } from "./Modal";
import type { Quarter, QuarterStatus } from "@/lib/types";

type Props = {
  quarter?: Quarter;
  defaultWorkingDays: number;
  onClose: () => void;
  onSubmit: (fields: {
    name: string;
    working_days: number;
    start_date?: string;
    end_date?: string;
    status?: QuarterStatus;
  }) => Promise<void>;
};

export function QuarterFormModal({
  quarter,
  defaultWorkingDays,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(quarter?.name ?? "");
  const [workingDays, setWorkingDays] = useState(
    quarter?.working_days ?? defaultWorkingDays
  );
  const [startDate, setStartDate] = useState(quarter?.start_date ?? "");
  const [endDate, setEndDate] = useState(quarter?.end_date ?? "");
  const [status, setStatus] = useState<QuarterStatus>(
    quarter?.status ?? "planning"
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({
      name: name.trim(),
      working_days: workingDays,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      ...(quarter ? { status } : {}),
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            {quarter ? "Edit Quarter" : "Create Quarter"}
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
              <label htmlFor="quarter-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Name
              </label>
              <input
                id="quarter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q2 2026"
                required
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {quarter && (
              <div>
                <label htmlFor="quarter-status" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Status
                </label>
                <select
                  id="quarter-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuarterStatus)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="quarter-working-days" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Working days
              </label>
              <input
                id="quarter-working-days"
                type="number"
                min={1}
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quarter-start-date" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Start date
                </label>
                <input
                  id="quarter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="quarter-end-date" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  End date
                </label>
                <input
                  id="quarter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
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
              disabled={saving || !name.trim()}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : quarter ? "Save" : "Create"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
