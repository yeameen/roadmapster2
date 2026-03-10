"use client";

import { ExternalLink, X } from "lucide-react";
import { Modal } from "./Modal";
import { useJiraStories } from "@/hooks/useJiraStories";
import { JIRA_STATUS_CATEGORY_COLORS } from "@/lib/constants";
import type { JiraStatusCategory } from "@/lib/types";

type Props = {
  epicId: string;
  epicTitle: string;
  jiraEpicKey: string | null;
  jiraUrl: string | null;
  onClose: () => void;
};

const STATUS_DOT_COLORS: Record<JiraStatusCategory, string> = {
  new: "bg-stone-400 dark:bg-stone-500",
  indeterminate: "bg-blue-500 dark:bg-blue-400",
  done: "bg-green-500 dark:bg-green-400",
};

export function EpicStoriesModal({
  epicId,
  epicTitle,
  jiraEpicKey,
  jiraUrl,
  onClose,
}: Props) {
  const { stories, loading, aggregation } = useJiraStories(epicId);

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-lg font-semibold text-stone-900 dark:text-white">
            {epicTitle}
          </h2>
          {jiraUrl && (
            <a
              href={jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
              title={`Open ${jiraEpicKey ?? "epic"} in Jira`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800"
              />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-8 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No stories synced for this epic.
            </p>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-stone-50 dark:bg-stone-800 px-4 py-3">
              <div className="text-sm text-stone-600 dark:text-stone-300">
                <span className="font-semibold text-stone-900 dark:text-white">
                  {aggregation.doneStories}
                </span>
                /{aggregation.totalStories} stories done
              </div>
              <div className="text-sm text-stone-600 dark:text-stone-300">
                <span className="font-semibold text-stone-900 dark:text-white">
                  {aggregation.donePoints}
                </span>
                /{aggregation.totalPoints} points done
              </div>
            </div>

            {/* Story list */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2"
                >
                  {/* Status dot */}
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[story.status_category]}`}
                    title={story.status}
                  />

                  {/* Issue key */}
                  <a
                    href={story.jira_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    {story.jira_issue_key}
                  </a>

                  {/* Title */}
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-900 dark:text-white">
                    {story.title}
                  </span>

                  {/* Assignee */}
                  {story.assignee && (
                    <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">
                      {story.assignee}
                    </span>
                  )}

                  {/* Story points */}
                  {story.story_points != null && (
                    <span className="shrink-0 rounded bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                      {story.story_points} pts
                    </span>
                  )}

                  {/* Issue type */}
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${JIRA_STATUS_CATEGORY_COLORS[story.status_category]}`}
                  >
                    {story.issue_type}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
