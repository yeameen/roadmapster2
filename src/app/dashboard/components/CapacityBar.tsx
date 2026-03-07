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
  let textColor = "text-green-700";
  if (utilization > CAPACITY_THRESHOLDS.AMBER_MAX) {
    barColor = "bg-red-500";
    textColor = "text-red-700";
  } else if (utilization > CAPACITY_THRESHOLDS.GREEN_MAX) {
    barColor = "bg-amber-500";
    textColor = "text-amber-700";
  }

  const remaining = finalCapacity - usedCapacity;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className={textColor}>
          {usedCapacity} / {finalCapacity} days ({Math.round(percentage)}%)
        </span>
        <span className="text-gray-500">
          {remaining} days remaining
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${barColor} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
