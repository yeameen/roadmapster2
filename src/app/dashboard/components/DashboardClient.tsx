"use client";

import { useState } from "react";
import { Settings, Plus, Pencil, Trash2, Users, Calendar } from "lucide-react";
import { useTeam } from "@/hooks/useTeam";
import { usePlanningMembers } from "@/hooks/usePlanningMembers";
import { useQuarters } from "@/hooks/useQuarters";
import { useQuarterMembers } from "@/hooks/useQuarterMembers";
import { useEpics } from "@/hooks/useEpics";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamSettingsModal } from "./TeamSettingsModal";
import { QuarterFormModal } from "./QuarterFormModal";
import { QuarterMembersModal } from "./QuarterMembersModal";
import { EpicFormModal } from "./EpicFormModal";
import type { Epic, Quarter, EpicPriority } from "@/lib/types";
import { PRIORITIES, PRIORITY_LABELS, SIZE_TO_DAYS } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
};

const SIZE_COLORS: Record<string, string> = {
  XS: "bg-blue-100 text-blue-700",
  S: "bg-cyan-100 text-cyan-700",
  M: "bg-purple-100 text-purple-700",
  L: "bg-orange-100 text-orange-700",
  XL: "bg-red-100 text-red-700",
};

export function DashboardClient({ workspaceId }: { workspaceId: string }) {
  const { team, loading: teamLoading, createTeam, updateTeam } = useTeam(workspaceId);
  const { members, addMember, updateMember, removeMember } = usePlanningMembers(team?.id ?? null);
  const { quarters, createQuarter, updateQuarter, deleteQuarter } = useQuarters(team?.id ?? null);
  const { epics, createEpic, updateEpic, deleteEpic } = useEpics(team?.id ?? null);

  const [showSettings, setShowSettings] = useState(false);
  const [showQuarterForm, setShowQuarterForm] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null);
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [quarterMembersQuarter, setQuarterMembersQuarter] = useState<Quarter | null>(null);

  // Quarter members hook for the currently selected quarter
  const { quarterMembers, initializeMembers, updateVacationDays } = useQuarterMembers(
    quarterMembersQuarter?.id ?? null
  );

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="py-12">
        <CreateTeamForm onSubmit={async (name) => { await createTeam(name); }} />
      </div>
    );
  }

  const backlogEpics = epics.filter((e) => !e.quarter_id);

  return (
    <>
      {/* Header bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{team.name}</h2>
          <p className="text-sm text-gray-500">
            {members.length} member{members.length !== 1 ? "s" : ""} · {quarters.length} quarter{quarters.length !== 1 ? "s" : ""} · {epics.length} epic{epics.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          Team Settings
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Backlog */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Backlog</h3>
            <button
              onClick={() => { setEditingEpic(null); setShowEpicForm(true); }}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Epic
            </button>
          </div>

          {backlogEpics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">No epics yet. Add your first epic to start planning.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {PRIORITIES.map((priority) => {
                const priorityEpics = backlogEpics.filter((e) => e.priority === priority);
                if (priorityEpics.length === 0) return null;
                return (
                  <PriorityGroup
                    key={priority}
                    priority={priority}
                    epics={priorityEpics}
                    onEdit={(epic) => { setEditingEpic(epic); setShowEpicForm(true); }}
                    onDelete={deleteEpic}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quarters */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Quarters</h3>
            <button
              onClick={() => { setEditingQuarter(null); setShowQuarterForm(true); }}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Quarter
            </button>
          </div>

          {quarters.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">No quarters yet. Create a quarter to start planning capacity.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quarters.map((quarter) => {
                const qEpics = epics.filter((e) => e.quarter_id === quarter.id);
                const usedDays = qEpics.reduce((sum, e) => sum + SIZE_TO_DAYS[e.size], 0);
                return (
                  <div key={quarter.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{quarter.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[quarter.status]}`}>
                            {quarter.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {qEpics.length} epic{qEpics.length !== 1 ? "s" : ""} · {usedDays} days used
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            setQuarterMembersQuarter(quarter);
                            await initializeMembers(quarter.id, members.map((m) => m.id));
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Member availability"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingQuarter(quarter); setShowQuarterForm(true); }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit quarter"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuarter(quarter.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete quarter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {qEpics.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {qEpics.map((epic) => (
                          <li key={epic.id} className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-2 py-1.5 text-sm">
                            <span className="text-gray-800">{epic.title}</span>
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SIZE_COLORS[epic.size]}`}>
                              {epic.size}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSettings && (
        <TeamSettingsModal
          team={team}
          members={members}
          onClose={() => setShowSettings(false)}
          onUpdateTeam={updateTeam}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onRemoveMember={removeMember}
        />
      )}

      {showQuarterForm && (
        <QuarterFormModal
          quarter={editingQuarter ?? undefined}
          defaultWorkingDays={team.default_working_days}
          onClose={() => { setShowQuarterForm(false); setEditingQuarter(null); }}
          onSubmit={async (fields) => {
            if (editingQuarter) {
              await updateQuarter(editingQuarter.id, fields);
            } else {
              await createQuarter(fields);
            }
          }}
        />
      )}

      {showEpicForm && (
        <EpicFormModal
          epic={editingEpic ?? undefined}
          onClose={() => { setShowEpicForm(false); setEditingEpic(null); }}
          onSubmit={async (fields) => {
            if (editingEpic) {
              await updateEpic(editingEpic.id, fields);
            } else {
              await createEpic(fields);
            }
          }}
        />
      )}

      {quarterMembersQuarter && (
        <QuarterMembersModal
          quarterName={quarterMembersQuarter.name}
          planningMembers={members}
          quarterMembers={quarterMembers}
          onClose={() => setQuarterMembersQuarter(null)}
          onUpdateVacationDays={updateVacationDays}
        />
      )}
    </>
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
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {priority} — {PRIORITY_LABELS[priority]} ({epics.length})
      </h4>
      <div className="space-y-1.5">
        {epics.map((epic) => (
          <div
            key={epic.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900">
                  {epic.title}
                </span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${SIZE_COLORS[epic.size]}`}>
                  {epic.size}
                </span>
              </div>
              {epic.owner && (
                <p className="mt-0.5 text-xs text-gray-500">{epic.owner}</p>
              )}
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
