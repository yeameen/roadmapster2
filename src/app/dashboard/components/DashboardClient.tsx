"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Settings, Users } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
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
import { WorkspaceMembersModal } from "./WorkspaceMembersModal";
import { Modal } from "./Modal";
import type { Epic, Quarter } from "@/lib/types";

type Props = {
  workspaceId: string;
  userId: string;
  userRole: "owner" | "admin" | "member";
};

export function DashboardClient({ workspaceId, userId, userRole }: Props) {
  const { teams, loading: teamsLoading, createTeam, updateTeam } = useTeams(workspaceId);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Auto-select first team, or reset if selected team disappears
  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamId(null);
      return;
    }
    if (!selectedTeamId || !teams.find((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const { members, addMember, updateMember, removeMember } = usePlanningMembers(activeTeam?.id ?? null);
  const { quarters, createQuarter, updateQuarter, deleteQuarter } = useQuarters(activeTeam?.id ?? null);
  const { epics, createEpic, updateEpic, deleteEpic } = useEpics(activeTeam?.id ?? null);
  const quarterIds = useMemo(() => quarters.map((q) => q.id), [quarters]);
  const { quarterMembersMap, refetch: refetchQuarterMembers } = useTeamQuarterMembers(quarterIds);

  const [showWorkspaceMembers, setShowWorkspaceMembers] = useState(false);
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

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading...</p>
      </div>
    );
  }

  function handleExport() {
    if (!activeTeam) return;
    const data = {
      team: {
        name: activeTeam.name,
        buffer_percentage: activeTeam.buffer_percentage,
        oncall_per_sprint: activeTeam.oncall_per_sprint,
        sprints_per_quarter: activeTeam.sprints_per_quarter,
        default_working_days: activeTeam.default_working_days,
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
    a.download = `${activeTeam.name.toLowerCase().replace(/\s+/g, "-")}-roadmap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (teams.length === 0) {
    return (
      <div className="py-12">
        <CreateTeamForm
          title="Create your first team"
          onSubmit={async (name) => { await createTeam(name); }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Team tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-stone-200 dark:border-stone-700">
        {teams.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTeamId(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              t.id === selectedTeamId
                ? "text-amber-700 dark:text-amber-400"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
          >
            {t.name}
            {t.id === selectedTeamId && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-amber-500" />
            )}
          </button>
        ))}
        <button
          onClick={() => setShowCreateTeam(true)}
          className="flex items-center gap-1 px-3 py-2.5 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          title="Add team"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {activeTeam && (
        <>
          {/* Header bar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{activeTeam.name}</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {members.length} member{members.length !== 1 ? "s" : ""} · {quarters.length} quarter{quarters.length !== 1 ? "s" : ""} · {epics.length} epic{epics.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWorkspaceMembers(true)}
                className="flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Users className="h-4 w-4" />
                Members
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                <Settings className="h-4 w-4" />
                Team Settings
              </button>
            </div>
          </div>

          <PlanningBoard
            team={activeTeam}
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
          {showWorkspaceMembers && (
            <WorkspaceMembersModal
              workspaceId={workspaceId}
              currentUserId={userId}
              userRole={userRole}
              onClose={() => setShowWorkspaceMembers(false)}
            />
          )}

          {showSettings && (
            <TeamSettingsModal
              team={activeTeam}
              members={members}
              onClose={() => setShowSettings(false)}
              onUpdateTeam={async (updates) => { await updateTeam(activeTeam.id, updates); }}
              onAddMember={addMember}
              onUpdateMember={updateMember}
              onRemoveMember={removeMember}
            />
          )}

          {showQuarterForm && (
            <QuarterFormModal
              quarter={editingQuarter ?? undefined}
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
      )}

      {/* Create team modal */}
      {showCreateTeam && (
        <Modal onClose={() => setShowCreateTeam(false)}>
          <div className="p-6">
            <CreateTeamForm
              onSubmit={async (name) => {
                const newTeam = await createTeam(name);
                if (newTeam) setSelectedTeamId(newTeam.id);
                setShowCreateTeam(false);
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
