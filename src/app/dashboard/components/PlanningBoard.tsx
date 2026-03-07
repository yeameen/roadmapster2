"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCorners,
  getFirstCollision,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { BacklogPanel } from "./BacklogPanel";
import { QuarterCard } from "./QuarterCard";
import { EpicCardContent } from "./EpicCard";
import { calculateCapacity, wouldExceedCapacity } from "@/lib/capacity";
import { DROPPABLE_IDS } from "@/lib/constants";
import type { Epic, Quarter, QuarterMember, Team } from "@/lib/types";

type Props = {
  team: Team;
  quarters: Quarter[];
  epics: Epic[];
  quarterMembersMap: Record<string, QuarterMember[]>;
  onUpdateEpic: (
    id: string,
    updates: Partial<Pick<Epic, "quarter_id" | "position">>
  ) => Promise<void>;
  onAddEpic: () => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (id: string) => Promise<void>;
  onCreateQuarter: () => void;
  onEditQuarter: (quarter: Quarter) => void;
  onDeleteQuarter: (id: string) => Promise<void>;
  onQuarterMembers: (quarter: Quarter) => void;
};

function stripEpicPrefix(id: string): string {
  return id.startsWith(DROPPABLE_IDS.EPIC_PREFIX)
    ? id.slice(DROPPABLE_IDS.EPIC_PREFIX.length)
    : id;
}

function containerToQuarterId(container: string): string | null {
  if (container === DROPPABLE_IDS.BACKLOG) return null;
  if (container.startsWith(DROPPABLE_IDS.QUARTER_PREFIX)) {
    return container.slice(DROPPABLE_IDS.QUARTER_PREFIX.length);
  }
  return null;
}

export function PlanningBoard({
  team,
  quarters,
  epics: propEpics,
  quarterMembersMap,
  onUpdateEpic,
  onAddEpic,
  onEditEpic,
  onDeleteEpic,
  onCreateQuarter,
  onEditQuarter,
  onDeleteQuarter,
  onQuarterMembers,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localEpics, setLocalEpics] = useState(propEpics);
  const snapshotRef = useRef(propEpics);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Auto-dismiss capacity warning
  useEffect(() => {
    if (capacityWarning) {
      const timer = window.setTimeout(() => setCapacityWarning(null), 3000);
      return () => window.clearTimeout(timer);
    }
  }, [capacityWarning]);

  // Sync local state with props when not dragging
  useEffect(() => {
    if (!activeId) {
      setLocalEpics(propEpics);
    }
  }, [propEpics, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Custom collision detection: pointer-first, fallback to closest corners
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  }, []);

  const activeEpic = useMemo(() => {
    if (!activeId) return null;
    const epicId = stripEpicPrefix(activeId);
    return localEpics.find((e) => e.id === epicId) ?? null;
  }, [activeId, localEpics]);

  const backlogEpics = useMemo(
    () => localEpics.filter((e) => !e.quarter_id),
    [localEpics]
  );

  const getQuarterEpics = useCallback(
    (quarterId: string) =>
      localEpics
        .filter((e) => e.quarter_id === quarterId)
        .sort((a, b) => a.position - b.position),
    [localEpics]
  );

  function findContainer(id: string): string | null {
    if (id === DROPPABLE_IDS.BACKLOG) return id;
    if (id.startsWith(DROPPABLE_IDS.QUARTER_PREFIX)) return id;
    if (id.startsWith(DROPPABLE_IDS.EPIC_PREFIX)) {
      const epicId = stripEpicPrefix(id);
      const epic = localEpics.find((e) => e.id === epicId);
      if (epic) {
        return epic.quarter_id
          ? `${DROPPABLE_IDS.QUARTER_PREFIX}${epic.quarter_id}`
          : DROPPABLE_IDS.BACKLOG;
      }
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    snapshotRef.current = localEpics;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const activeEpicId = stripEpicPrefix(active.id as string);
    const newQuarterId = containerToQuarterId(overContainer);

    setLocalEpics((prev) => {
      const targetCount = prev.filter(
        (e) => e.quarter_id === newQuarterId && e.id !== activeEpicId
      ).length;

      return prev.map((e) =>
        e.id === activeEpicId
          ? { ...e, quarter_id: newQuarterId, position: targetCount }
          : e
      );
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      setLocalEpics(snapshotRef.current);
      return;
    }

    const activeEpicId = stripEpicPrefix(active.id as string);
    const original = snapshotRef.current.find((e) => e.id === activeEpicId);
    const current = localEpics.find((e) => e.id === activeEpicId);

    if (!original || !current) return;

    const crossedContainers = original.quarter_id !== current.quarter_id;

    if (crossedContainers) {
      // If moving to a quarter, check capacity
      if (current.quarter_id) {
        const quarter = quarters.find((q) => q.id === current.quarter_id);
        if (quarter) {
          const qMembers = quarterMembersMap[quarter.id] ?? [];
          const existingEpics = localEpics.filter(
            (e) => e.quarter_id === quarter.id && e.id !== activeEpicId
          );
          const capacity = calculateCapacity({
            workingDays: quarter.working_days,
            quarterMembers: qMembers,
            bufferPercentage: team.buffer_percentage,
            oncallPerSprint: team.oncall_per_sprint,
            sprintsPerQuarter: team.sprints_per_quarter,
            assignedEpics: existingEpics,
          });

          if (wouldExceedCapacity(capacity, current.size)) {
            setLocalEpics(snapshotRef.current);
            setCapacityWarning(
              `"${current.title}" (${current.size}) would exceed ${quarter.name}'s capacity (${capacity.remaining} days remaining)`
            );
            return;
          }
        }
      }

      // Cross-container move: persist quarter_id change
      const targetCount = localEpics.filter(
        (e) => e.quarter_id === current.quarter_id && e.id !== activeEpicId
      ).length;

      onUpdateEpic(activeEpicId, {
        quarter_id: current.quarter_id,
        position: targetCount,
      });
    } else if (
      current.quarter_id &&
      (over.id as string).startsWith(DROPPABLE_IDS.EPIC_PREFIX)
    ) {
      // Same quarter: reorder
      const overEpicId = stripEpicPrefix(over.id as string);
      if (activeEpicId !== overEpicId) {
        const containerEpics = localEpics
          .filter((e) => e.quarter_id === current.quarter_id)
          .sort((a, b) => a.position - b.position);

        const oldIndex = containerEpics.findIndex((e) => e.id === activeEpicId);
        const newIndex = containerEpics.findIndex((e) => e.id === overEpicId);

        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          const reordered = arrayMove(containerEpics, oldIndex, newIndex);
          reordered.forEach((e, i) => {
            if (e.position !== i) {
              onUpdateEpic(e.id, { position: i });
            }
          });
        }
      }
    }
  }

  function handleDragCancel() {
    setLocalEpics(snapshotRef.current);
    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BacklogPanel
          epics={backlogEpics}
          onAddEpic={onAddEpic}
          onEditEpic={onEditEpic}
          onDeleteEpic={(id) => { onDeleteEpic(id); }}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Quarters</h3>
            <button
              onClick={onCreateQuarter}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Quarter
            </button>
          </div>

          {quarters.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No quarters yet. Create a quarter to start planning capacity.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quarters.map((quarter) => (
                <QuarterCard
                  key={quarter.id}
                  quarter={quarter}
                  team={team}
                  quarterMembers={quarterMembersMap[quarter.id] ?? []}
                  epics={getQuarterEpics(quarter.id)}
                  onEditQuarter={onEditQuarter}
                  onDeleteQuarter={(id) => { onDeleteQuarter(id); }}
                  onQuarterMembers={onQuarterMembers}
                  onEditEpic={onEditEpic}
                  onDeleteEpic={(id) => { onDeleteEpic(id); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeEpic ? <EpicCardContent epic={activeEpic} isDragOverlay /> : null}
      </DragOverlay>

      {capacityWarning && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {capacityWarning}
        </div>
      )}
    </DndContext>
  );
}
