import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardClient } from "./components/DashboardClient";
import { WorkspaceSwitcher } from "./components/WorkspaceSwitcher";

type SearchParams = Promise<{ workspace?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;

  // Fetch all workspace memberships
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-12 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No workspace found. Please sign out and sign in again.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all workspace names
  const workspaceIds = memberships.map((m) => m.workspace_id);
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name")
    .in("id", workspaceIds);

  // Determine active workspace from URL param or default to first
  const requestedWorkspace = params.workspace;
  const activeMembership = memberships.find((m) => m.workspace_id === requestedWorkspace)
    ?? memberships[0];

  const activeWorkspace = workspaces?.find((w) => w.id === activeMembership.workspace_id);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-warm">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-stone-900 dark:text-white">
              Roadmapster
            </h1>
            {workspaces && workspaces.length > 1 ? (
              <WorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={activeMembership.workspace_id}
              />
            ) : activeWorkspace ? (
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {activeWorkspace.name}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-600 dark:text-stone-400 sm:inline">{user.email}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <DashboardClient
          workspaceId={activeMembership.workspace_id}
          userId={user.id}
          userRole={activeMembership.role as "owner" | "admin" | "member"}
        />
      </main>
    </div>
  );
}
