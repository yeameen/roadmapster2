"use client";

import { useJiraStories } from "@/hooks/useJiraStories";

type Props = {
  epicId: string;
  onClick?: () => void;
};

export function EpicProgressBadge({ epicId, onClick }: Props) {
  const { loading, aggregation } = useJiraStories(epicId);

  if (loading || aggregation.totalStories === 0) return null;

  const progress =
    aggregation.totalStories > 0
      ? aggregation.doneStories / aggregation.totalStories
      : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 block w-full cursor-pointer text-left group"
    >
      <span className="text-xs text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-300 transition-colors">
        {aggregation.doneStories}/{aggregation.totalStories} stories
        {" · "}
        {aggregation.donePoints}/{aggregation.totalPoints} pts
      </span>
      <div className="mt-0.5 h-0.5 w-full rounded-full bg-stone-200 dark:bg-stone-700">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </button>
  );
}
