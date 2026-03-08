"use client";

import { useState } from "react";

export function CreateTeamForm({
  onSubmit,
}: {
  onSubmit: (name: string) => Promise<void>;
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
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Create your first team
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        A team owns a roadmap. You can configure capacity settings after
        creation.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create team"}
        </button>
      </form>
    </div>
  );
}
