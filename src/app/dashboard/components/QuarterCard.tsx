"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SortableEpicCard } from "./EpicCard";
import { CapacityBar } from "./CapacityBar";
import { calculateCapacity } from "@/lib/capacity";
import { DROPPABLE_IDS, STATUS_COLORS } from "@/lib/constants";
import type { Epic, Quarter, QuarterMember, Team } from "@/lib/types";

type Props = {
  quarter: Quarter;
  team: Pick<Team, "buffer_percentage" | "oncall_per_sprint" | "sprints_per_quarter">;
  quarterMembers: QuarterMember[];
  epics: Epic[];
  onEditQuarter: (quarter: Quarter) => void;
  onDeleteQuarter: (id: string) => void;
  onQuarterMembers: (quarter: Quarter) => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (id: string) => void;
};

export function QuarterCard({
  quarter,
  team,
  quarterMembers,
  epics,
  onEditQuarter,
  onDeleteQuarter,
  onQuarterMembers,
  onEditEpic,
  onDeleteEpic,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const droppableId = `${DROPPABLE_IDS.QUARTER_PREFIX}${quarter.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const sortableIds = epics.map((e) => `${DROPPABLE_IDS.EPIC_PREFIX}${e.id}`);

  const capacity = useMemo(() => calculateCapacity({
    workingDays: quarter.working_days,
    quarterMembers,
    bufferPercentage: team.buffer_percentage,
    oncallPerSprint: team.oncall_per_sprint,
    sprintsPerQuarter: team.sprints_per_quarter,
    assignedEpics: epics,
  }), [quarter.working_days, quarterMembers, team.buffer_percentage, team.oncall_per_sprint, team.sprints_per_quarter, epics]);

  return (
    <>
    <div
      className={`rounded-2xl border bg-white dark:bg-stone-900 shadow-warm transition-colors ${
        isOver ? "border-amber-400 dark:border-amber-500 ring-1 ring-amber-200 dark:ring-amber-800" : "border-stone-200 dark:border-stone-700"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-0.5 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
              aria-label={collapsed ? "Expand quarter" : "Collapse quarter"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-stone-900 dark:text-white">{quarter.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[quarter.status]}`}
                >
                  {quarter.status.charAt(0).toUpperCase() + quarter.status.slice(1)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                {epics.length} epic{epics.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuarterMembers(quarter)}
              className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
              title="Member availability"
              aria-label="Member availability"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditQuarter(quarter)}
              className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
              title="Edit quarter"
              aria-label="Edit quarter"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              title="Delete quarter"
              aria-label="Delete quarter"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CapacityBar capacity={capacity} />
      </div>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`min-h-[48px] border-t border-stone-100 dark:border-stone-800 px-4 py-3 ${
            isOver ? "bg-amber-50/50 dark:bg-amber-900/20" : ""
          }`}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {epics.length === 0 ? (
              <p className="py-2 text-center text-xs text-stone-400 dark:text-stone-500">
                Drop epics here
              </p>
            ) : (
              <div className="space-y-2">
                {epics.map((epic) => (
                  <SortableEpicCard
                    key={epic.id}
                    epic={epic}
                    onEdit={onEditEpic}
                    onDelete={onDeleteEpic}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      )}
    </div>
    {confirmDelete && (
      <ConfirmDialog
        title="Delete quarter"
        message={`Are you sure you want to delete "${quarter.name}"? All epics in this quarter will be moved to the backlog.`}
        onConfirm={() => {
          onDeleteQuarter(quarter.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    </>
  );
}
