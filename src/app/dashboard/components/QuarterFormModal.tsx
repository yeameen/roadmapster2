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
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {quarter ? "Edit Quarter" : "Create Quarter"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="quarter-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="quarter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q2 2026"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {quarter && (
              <div>
                <label htmlFor="quarter-status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="quarter-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as QuarterStatus)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="quarter-working-days" className="block text-sm font-medium text-gray-700">
                Working days
              </label>
              <input
                id="quarter-working-days"
                type="number"
                min={1}
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quarter-start-date" className="block text-sm font-medium text-gray-700">
                  Start date
                </label>
                <input
                  id="quarter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="quarter-end-date" className="block text-sm font-medium text-gray-700">
                  End date
                </label>
                <input
                  id="quarter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : quarter ? "Save" : "Create"}
            </button>
          </div>
        </form>
    </Modal>
  );
}
