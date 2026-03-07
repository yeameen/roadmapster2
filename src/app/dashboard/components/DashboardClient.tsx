"use client";

import { useState } from "react";
import { Download, Settings } from "lucide-react";
import { useTeam } from "@/hooks/useTeam";
import { usePlanningMembers } from "@/hooks/usePlanningMembers";
import { useQuarters } from "@/hooks/useQuarters";
import { useQuarterMembers } from "@/hooks/useQuarterMembers";
import { useEpics } from "@/hooks/useEpics";
import { useTeamQuarterMembers } from "@/hooks/useTeamQuarterMembers";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamSettingsModal } from "./TeamSettingsModal";
import { QuarterFormModal } from "./QuarterFormModal";
import { QuarterMembersModal } from "./QuarterMembersModal";
import { EpicFormModal } from "./EpicFormModal";
import { PlanningBoard } from "./PlanningBoard";
import type { Epic, Quarter } from "@/lib/types";

export function DashboardClient({ workspaceId }: { workspaceId: string }) {
  const { team, loading: teamLoading, createTeam, updateTeam } = useTeam(workspaceId);
  const { members, addMember, updateMember, removeMember } = usePlanningMembers(team?.id ?? null);
  const { quarters, createQuarter, updateQuarter, deleteQuarter } = useQuarters(team?.id ?? null);
  const { epics, createEpic, updateEpic, deleteEpic } = useEpics(team?.id ?? null);
  const { quarterMembersMap, refetch: refetchQuarterMembers } = useTeamQuarterMembers(
    quarters.map((q) => q.id)
  );

  const [showSettings, setShowSettings] = useState(false);
  const [showQuarterForm, setShowQuarterForm] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState<Quarter | null>(null);
  const [showEpicForm, setShowEpicForm] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [quarterMembersQuarter, setQuarterMembersQuarter] = useState<Quarter | null>(null);

  // Single-quarter members hook for the vacation days modal
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

  function handleExport() {
    if (!team) return;
    const data = {
      team: {
        name: team.name,
        buffer_percentage: team.buffer_percentage,
        oncall_per_sprint: team.oncall_per_sprint,
        sprints_per_quarter: team.sprints_per_quarter,
        default_working_days: team.default_working_days,
      },
      members: members.map((m) => ({ name: m.name, skills: m.skills })),
      quarters: quarters.map((q) => ({
        name: q.name,
        status: q.status,
        working_days: q.working_days,
        start_date: q.start_date,
        end_date: q.end_date,
        members: (quarterMembersMap[q.id] ?? []).map((qm) => {
          const member = members.find((m) => m.id === qm.planning_member_id);
          return { name: member?.name ?? "Unknown", vacation_days: qm.vacation_days };
        }),
        epics: epics
          .filter((e) => e.quarter_id === q.id)
          .sort((a, b) => a.position - b.position)
          .map((e) => ({
            title: e.title,
            size: e.size,
            priority: e.priority,
            description: e.description,
            owner: e.owner,
          })),
      })),
      backlog: epics
        .filter((e) => !e.quarter_id)
        .map((e) => ({
          title: e.title,
          size: e.size,
          priority: e.priority,
          description: e.description,
          owner: e.owner,
        })),
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${team.name.toLowerCase().replace(/\s+/g, "-")}-roadmap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!team) {
    return (
      <div className="py-12">
        <CreateTeamForm onSubmit={async (name) => { await createTeam(name); }} />
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Team Settings
          </button>
        </div>
      </div>

      <PlanningBoard
        team={team}
        quarters={quarters}
        epics={epics}
        quarterMembersMap={quarterMembersMap}
        onUpdateEpic={updateEpic}
        onAddEpic={() => { setEditingEpic(null); setShowEpicForm(true); }}
        onEditEpic={(epic) => { setEditingEpic(epic); setShowEpicForm(true); }}
        onDeleteEpic={deleteEpic}
        onCreateQuarter={() => { setEditingQuarter(null); setShowQuarterForm(true); }}
        onEditQuarter={(quarter) => { setEditingQuarter(quarter); setShowQuarterForm(true); }}
        onDeleteQuarter={deleteQuarter}
        onQuarterMembers={async (quarter) => {
          setQuarterMembersQuarter(quarter);
          await initializeMembers(quarter.id, members.map((m) => m.id));
        }}
      />

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
          onClose={() => {
            setQuarterMembersQuarter(null);
            refetchQuarterMembers();
          }}
          onUpdateVacationDays={updateVacationDays}
        />
      )}
    </>
  );
}
