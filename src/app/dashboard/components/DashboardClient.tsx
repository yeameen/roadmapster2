"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useTeam } from "@/hooks/useTeam";
import { usePlanningMembers } from "@/hooks/usePlanningMembers";
import { CreateTeamForm } from "./CreateTeamForm";
import { TeamSettingsModal } from "./TeamSettingsModal";

export function DashboardClient({ workspaceId }: { workspaceId: string }) {
  const { team, loading, createTeam, updateTeam } = useTeam(workspaceId);
  const {
    members,
    addMember,
    updateMember,
    removeMember,
  } = usePlanningMembers(team?.id ?? null);
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="py-12">
        <CreateTeamForm
          onSubmit={async (name) => {
            await createTeam(name);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{team.name}</h2>
          <p className="text-sm text-gray-500">
            {members.length} planning member{members.length !== 1 ? "s" : ""}
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

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <h3 className="text-base font-medium text-gray-900">
            Add planning members
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add team members to start capacity planning. Open Team Settings to
            get started.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Team Settings
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <h3 className="text-base font-medium text-gray-900">
            Ready for planning
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Quarters and epics are coming in the next milestone.
          </p>
        </div>
      )}

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
    </>
  );
}
