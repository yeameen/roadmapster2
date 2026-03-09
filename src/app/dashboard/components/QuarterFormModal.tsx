"use client";

import { useMemo, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import { calculateWorkingDays } from "@/lib/workingDays";
import type { Quarter, QuarterStatus } from "@/lib/types";

type Props = {
  quarter?: Quarter;
  onClose: () => void;
  onSubmit: (fields: {
    name: string;
    working_days: number;
    start_date: string;
    end_date: string;
    holidays: string[];
    status?: QuarterStatus;
  }) => Promise<void>;
};

export function QuarterFormModal({
  quarter,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState(quarter?.name ?? "");
  const [startDate, setStartDate] = useState(quarter?.start_date ?? "");
  const [endDate, setEndDate] = useState(quarter?.end_date ?? "");
  const [holidays, setHolidays] = useState<string[]>(quarter?.holidays ?? []);
  const [newHoliday, setNewHoliday] = useState("");
  const [status, setStatus] = useState<QuarterStatus>(
    quarter?.status ?? "planning"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workingDays = useMemo(
    () => (startDate && endDate ? calculateWorkingDays(startDate, endDate, holidays) : 0),
    [startDate, endDate, holidays]
  );

  function addHoliday() {
    const date = newHoliday.trim();
    if (!date || holidays.includes(date)) return;
    setHolidays([...holidays, date].sort());
    setNewHoliday("");
  }

  function removeHoliday(date: string) {
    setHolidays(holidays.filter((h) => h !== date));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        working_days: workingDays,
        start_date: startDate,
        end_date: endDate,
        holidays,
        ...(quarter ? { status } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = name.trim() && startDate && endDate && endDate >= startDate;

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
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
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
                  required
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
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Working days display */}
            {startDate && endDate && endDate >= startDate && (
              <div className="rounded-xl bg-stone-50 dark:bg-stone-800 px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-stone-600 dark:text-stone-400">Working days</span>
                  <span className="text-lg font-semibold text-stone-900 dark:text-white">{workingDays}</span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  Weekdays between dates, minus {holidays.length} holiday{holidays.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Holidays */}
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Holidays
              </label>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                Add dates that should not count as working days
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={newHoliday}
                  min={startDate || undefined}
                  max={endDate || undefined}
                  onChange={(e) => setNewHoliday(e.target.value)}
                  className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-1.5 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={addHoliday}
                  disabled={!newHoliday}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {holidays.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {holidays.map((date) => (
                    <li
                      key={date}
                      className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-1.5"
                    >
                      <span className="text-sm text-stone-700 dark:text-stone-300">
                        {formatHolidayDate(date)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeHoliday(date)}
                        className="rounded p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                        aria-label={`Remove ${date}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
              disabled={saving || !canSubmit}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : quarter ? "Save" : "Create"}
            </button>
          </div>
        </form>
    </Modal>
  );
}

function formatHolidayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
