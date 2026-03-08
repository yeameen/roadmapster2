"use client";

import { X } from "lucide-react";
import { Modal } from "./Modal";
import type { PlanningMember, QuarterMember } from "@/lib/types";

type Props = {
  quarterName: string;
  planningMembers: PlanningMember[];
  quarterMembers: QuarterMember[];
  onClose: () => void;
  onUpdateVacationDays: (quarterMemberId: string, days: number) => Promise<void>;
};

export function QuarterMembersModal({
  quarterName,
  planningMembers,
  quarterMembers,
  onClose,
  onUpdateVacationDays,
}: Props) {
  const memberMap = new Map(
    quarterMembers.map((qm) => [qm.planning_member_id, qm])
  );

  return (
    <Modal onClose={onClose}>
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
              Member Availability
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{quarterName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {planningMembers.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400 dark:text-stone-500">
              No planning members on the team yet.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Set vacation days for each member this quarter.
              </p>
              {planningMembers.map((pm) => {
                const qm = memberMap.get(pm.id);
                return (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-stone-900 dark:text-white">
                      {pm.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={qm?.vacation_days ?? 0}
                        onChange={(e) => {
                          if (qm) {
                            onUpdateVacationDays(qm.id, Number(e.target.value));
                          }
                        }}
                        disabled={!qm}
                        className="w-20 rounded-xl border border-stone-300 dark:border-stone-600 px-2 py-1 text-right text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:bg-stone-100 dark:disabled:bg-stone-800"
                      />
                      <span className="text-xs text-stone-500 dark:text-stone-400">days off</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-stone-200 dark:border-stone-700 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
          >
            Done
          </button>
        </div>
    </Modal>
  );
}
