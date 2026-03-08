"use client";

import { CAPACITY_THRESHOLDS } from "@/lib/constants";
import type { CapacityResult } from "@/lib/types";

type Props = {
  capacity: CapacityResult;
};

export function CapacityBar({ capacity }: Props) {
  const { usedCapacity, finalCapacity, utilization } = capacity;
  const percentage = Math.min(utilization * 100, 100);

  let barColor = "bg-green-500";
  let textColor = "text-green-700 dark:text-green-400";
  if (utilization > CAPACITY_THRESHOLDS.AMBER_MAX) {
    barColor = "bg-red-500";
    textColor = "text-red-700 dark:text-red-400";
  } else if (utilization > CAPACITY_THRESHOLDS.GREEN_MAX) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700 dark:text-amber-400";
  }

  const remaining = finalCapacity - usedCapacity;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className={textColor}>
          {usedCapacity} / {finalCapacity} days ({Math.round(percentage)}%)
        </span>
        <span className="text-stone-500 dark:text-stone-400">
          {remaining} days remaining
        </span>
      </div>
      <div className="mt-1 h-2.5 w-full rounded-full bg-stone-200 dark:bg-stone-700">
        <div
          className={`h-2.5 rounded-full ${barColor} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
