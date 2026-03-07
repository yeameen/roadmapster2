"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import { SortableEpicCard } from "./EpicCard";
import { CapacityBar } from "./CapacityBar";
import { calculateCapacity } from "@/lib/capacity";
import { DROPPABLE_IDS } from "@/lib/constants";
import type { Epic, Quarter, QuarterMember, Team } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
};

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
  const droppableId = `${DROPPABLE_IDS.QUARTER_PREFIX}${quarter.id}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  const sortableIds = epics.map((e) => `${DROPPABLE_IDS.EPIC_PREFIX}${e.id}`);

  const capacity = calculateCapacity({
    workingDays: quarter.working_days,
    quarterMembers,
    bufferPercentage: team.buffer_percentage,
    oncallPerSprint: team.oncall_per_sprint,
    sprintsPerQuarter: team.sprints_per_quarter,
    assignedEpics: epics,
  });

  return (
    <div
      className={`rounded-lg border bg-white transition-colors ${
        isOver ? "border-blue-400 ring-1 ring-blue-200" : "border-gray-200"
      }`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{quarter.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[quarter.status]}`}
                >
                  {quarter.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {epics.length} epic{epics.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuarterMembers(quarter)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Member availability"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditQuarter(quarter)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Edit quarter"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteQuarter(quarter.id)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Delete quarter"
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
          className={`min-h-[48px] border-t border-gray-100 px-4 py-3 ${
            isOver ? "bg-blue-50/50" : ""
          }`}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {epics.length === 0 ? (
              <p className="py-2 text-center text-xs text-gray-400">
                Drop epics here
              </p>
            ) : (
              <div className="space-y-1.5">
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
  );
}
