"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Modal } from "./Modal";
import type { Team, PlanningMember } from "@/lib/types";

type Props = {
  team: Team;
  members: PlanningMember[];
  onClose: () => void;
  onUpdateTeam: (updates: Partial<Pick<Team, "name" | "buffer_percentage" | "oncall_per_sprint" | "sprints_per_quarter" | "default_working_days">>) => Promise<void>;
  onAddMember: (name: string, skills?: string[]) => Promise<unknown>;
  onUpdateMember: (id: string, updates: Partial<Pick<PlanningMember, "name" | "skills">>) => Promise<void>;
  onRemoveMember: (id: string) => Promise<void>;
};

export function TeamSettingsModal({
  team,
  members,
  onClose,
  onUpdateTeam,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
}: Props) {
  const [teamName, setTeamName] = useState(team.name);
  const [bufferPct, setBufferPct] = useState(Math.round(team.buffer_percentage * 100));
  const [oncall, setOncall] = useState(team.oncall_per_sprint);
  const [sprints, setSprints] = useState(team.sprints_per_quarter);
  const [workingDays, setWorkingDays] = useState(team.default_working_days);
  const [newMemberName, setNewMemberName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSaveSettings() {
    setSaving(true);
    await onUpdateTeam({
      name: teamName,
      buffer_percentage: bufferPct / 100,
      oncall_per_sprint: oncall,
      sprints_per_quarter: sprints,
      default_working_days: workingDays,
    });
    setSaving(false);
    onClose();
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await onAddMember(newMemberName.trim());
    setNewMemberName("");
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
            Team Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* Team settings */}
          <div className="space-y-4">
            <div>
              <label htmlFor="team-name" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                Team name
              </label>
              <input
                id="team-name"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="buffer-pct" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Buffer %
                </label>
                <input
                  id="buffer-pct"
                  type="number"
                  min={0}
                  max={100}
                  value={bufferPct}
                  onChange={(e) => setBufferPct(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="oncall" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  On-call / sprint
                </label>
                <input
                  id="oncall"
                  type="number"
                  min={0}
                  value={oncall}
                  onChange={(e) => setOncall(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="sprints" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Sprints / quarter
                </label>
                <input
                  id="sprints"
                  type="number"
                  min={1}
                  value={sprints}
                  onChange={(e) => setSprints(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label htmlFor="working-days" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
                  Working days / quarter
                </label>
                <input
                  id="working-days"
                  type="number"
                  min={1}
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-2 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Planning members */}
          <div className="mt-6 border-t border-stone-200 dark:border-stone-700 pt-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
              Planning Members
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              People counted in capacity calculations. They don&apos;t need a
              login.
            </p>

            <form
              onSubmit={handleAddMember}
              className="mt-3 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Member name"
                className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-3 py-1.5 text-sm text-stone-900 dark:text-white shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={!newMemberName.trim()}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </form>

            <ul className="mt-3 space-y-2">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onUpdate={onUpdateMember}
                  onRemove={onRemoveMember}
                />
              ))}
              {members.length === 0 && (
                <li className="py-3 text-center text-sm text-stone-400 dark:text-stone-500">
                  No planning members yet
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-end border-t border-stone-200 dark:border-stone-700 px-6 py-4">
          <button
            onClick={onClose}
            className="mr-3 rounded-xl border border-stone-300 dark:border-stone-600 px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving || !teamName.trim()}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
    </Modal>
  );
}

function MemberRow({
  member,
  onUpdate,
  onRemove,
}: {
  member: PlanningMember;
  onUpdate: (id: string, updates: Partial<Pick<PlanningMember, "name" | "skills">>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [skillsInput, setSkillsInput] = useState(member.skills.join(", "));

  async function handleSave() {
    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await onUpdate(member.id, { name, skills });
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-2 py-1 text-sm text-stone-900 dark:text-white"
            placeholder="Name"
          />
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            className="block w-full rounded-xl border border-stone-300 dark:border-stone-600 px-2 py-1 text-sm text-stone-900 dark:text-white"
            placeholder="Skills (comma-separated)"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800"
            >
              Save
            </button>
            <button
              onClick={() => {
                setName(member.name);
                setSkillsInput(member.skills.join(", "));
                setEditing(false);
              }}
              className="rounded px-2 py-1 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700 px-3 py-2">
      <div>
        <span className="text-sm font-medium text-stone-900 dark:text-white">{member.name}</span>
        {member.skills.length > 0 && (
          <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">
            · {member.skills.join(", ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditing(true)}
          className="rounded px-2 py-1 text-xs text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-300"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(member.id)}
          className="rounded p-1 text-stone-400 dark:text-stone-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
