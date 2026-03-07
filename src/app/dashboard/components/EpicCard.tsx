"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { Epic } from "@/lib/types";
import { DROPPABLE_IDS } from "@/lib/constants";

const SIZE_COLORS: Record<string, string> = {
  XS: "bg-blue-100 text-blue-700",
  S: "bg-cyan-100 text-cyan-700",
  M: "bg-purple-100 text-purple-700",
  L: "bg-orange-100 text-orange-700",
  XL: "bg-red-100 text-red-700",
};

type ContentProps = {
  epic: Epic;
  onEdit?: (epic: Epic) => void;
  onDelete?: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragOverlay?: boolean;
};

export function EpicCardContent({
  epic,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragOverlay,
}: ContentProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 ${
        isDragOverlay ? "shadow-lg ring-2 ring-blue-400" : ""
      }`}
    >
      <button
        className="shrink-0 cursor-grab touch-none text-gray-400 hover:text-gray-600"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {epic.title}
          </span>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SIZE_COLORS[epic.size]}`}
          >
            {epic.size}
          </span>
        </div>
        {epic.owner && (
          <p className="mt-0.5 text-xs text-gray-500">{epic.owner}</p>
        )}
      </div>
      {onEdit && onDelete && (
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(epic)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(epic.id)}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

type SortableProps = {
  epic: Epic;
  onEdit: (epic: Epic) => void;
  onDelete: (id: string) => void;
};

export function SortableEpicCard({ epic, onEdit, onDelete }: SortableProps) {
  const sortableId = `${DROPPABLE_IDS.EPIC_PREFIX}${epic.id}`;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <EpicCardContent
        epic={epic}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}
