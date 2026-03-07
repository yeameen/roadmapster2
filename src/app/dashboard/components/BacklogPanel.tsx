"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { SortableEpicCard } from "./EpicCard";
import { DROPPABLE_IDS, PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import type { Epic, EpicPriority } from "@/lib/types";

type Props = {
  epics: Epic[];
  onAddEpic: () => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (id: string) => void;
};

export function BacklogPanel({ epics, onAddEpic, onEditEpic, onDeleteEpic }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: DROPPABLE_IDS.BACKLOG });

  const sortableIds = epics.map((e) => `${DROPPABLE_IDS.EPIC_PREFIX}${e.id}`);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Backlog</h3>
        <button
          onClick={onAddEpic}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Epic
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[200px] rounded-lg border-2 border-dashed p-3 transition-colors ${
          isOver ? "border-blue-400 bg-blue-50" : "border-transparent"
        }`}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {epics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No epics yet. Add your first epic to start planning.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {PRIORITIES.map((priority) => {
                const priorityEpics = epics.filter((e) => e.priority === priority);
                if (priorityEpics.length === 0) return null;
                return (
                  <PriorityGroup
                    key={priority}
                    priority={priority}
                    epics={priorityEpics}
                    onEdit={onEditEpic}
                    onDelete={onDeleteEpic}
                  />
                );
              })}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function PriorityGroup({
  priority,
  epics,
  onEdit,
  onDelete,
}: {
  priority: EpicPriority;
  epics: Epic[];
  onEdit: (epic: Epic) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {priority} — {PRIORITY_LABELS[priority]} ({epics.length})
      </h4>
      <div className="space-y-1.5">
        {epics.map((epic) => (
          <SortableEpicCard
            key={epic.id}
            epic={epic}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
