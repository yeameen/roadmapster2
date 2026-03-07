import type { CapacityResult, Epic, QuarterMember } from "./types";
import { SIZE_TO_DAYS } from "./constants";

export function calculateCapacity(params: {
  workingDays: number;
  quarterMembers: Pick<QuarterMember, "vacation_days">[];
  bufferPercentage: number;
  oncallPerSprint: number;
  sprintsPerQuarter: number;
  assignedEpics: Pick<Epic, "size">[];
}): CapacityResult {
  const {
    workingDays,
    quarterMembers,
    bufferPercentage,
    oncallPerSprint,
    sprintsPerQuarter,
    assignedEpics,
  } = params;

  const totalAvailable = quarterMembers.reduce((sum, member) => {
    return sum + Math.max(0, workingDays - member.vacation_days);
  }, 0);

  const oncallLoad = oncallPerSprint * sprintsPerQuarter * 10;
  const afterOncall = Math.max(0, totalAvailable - oncallLoad);
  const buffer = Math.round(afterOncall * bufferPercentage);
  const finalCapacity = Math.max(0, afterOncall - buffer);

  const usedCapacity = assignedEpics.reduce((sum, epic) => {
    return sum + SIZE_TO_DAYS[epic.size];
  }, 0);

  const remaining = Math.max(0, finalCapacity - usedCapacity);
  const utilization = finalCapacity > 0 ? usedCapacity / finalCapacity : 0;

  return {
    totalAvailable,
    oncallLoad,
    afterOncall,
    buffer,
    finalCapacity,
    usedCapacity,
    remaining,
    utilization,
  };
}

export function wouldExceedCapacity(
  currentCapacity: CapacityResult,
  epicSize: Epic["size"]
): boolean {
  return currentCapacity.usedCapacity + SIZE_TO_DAYS[epicSize] > currentCapacity.finalCapacity;
}
