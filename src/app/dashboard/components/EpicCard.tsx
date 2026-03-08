"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Epic } from "@/lib/types";
import { DROPPABLE_IDS, SIZE_COLORS } from "@/lib/constants";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div
        className={`flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 shadow-warm ${
          isDragOverlay ? "shadow-lg ring-2 ring-amber-400 dark:ring-amber-500" : ""
        }`}
      >
        <button
          className="shrink-0 cursor-grab touch-none text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          aria-label="Reorder"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-stone-900 dark:text-white">
              {epic.title}
            </span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SIZE_COLORS[epic.size]}`}
            >
              {epic.size}
            </span>
          </div>
          {epic.owner && (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{epic.owner}</p>
          )}
        </div>
        {onEdit && onDelete && (
          <div className="ml-2 flex shrink-0 items-center gap-1">
            <button
              onClick={() => onEdit(epic)}
              className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
              aria-label="Edit epic"
              title="Edit epic"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              aria-label="Delete epic"
              title="Delete epic"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title="Delete epic"
          message={`Are you sure you want to delete "${epic.title}"? This cannot be undone.`}
          onConfirm={() => {
            onDelete(epic.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
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
