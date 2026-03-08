"use client";

import { useState } from "react";

export function CreateTeamForm({
  onSubmit,
  title = "Create a team",
}: {
  onSubmit: (name: string) => Promise<void>;
  title?: string;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSubmit(name.trim());
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-8 shadow-warm">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        A team owns a roadmap. You can configure capacity settings after
        creation.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Team name
          </label>
          <input
            id="team-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Platform Team"
            required
            className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create team"}
        </button>
      </form>
    </div>
  );
}
