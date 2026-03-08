import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardClient } from "./components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  let workspaceName: string | null = null;
  if (membership) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", membership.workspace_id)
      .single();
    workspaceName = workspace?.name ?? null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-warm">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div>
            <h1 className="text-lg font-semibold text-stone-900 dark:text-white">
              Roadmapster
            </h1>
            {workspaceName && (
              <p className="text-sm text-stone-500 dark:text-stone-400">{workspaceName}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-stone-600 dark:text-stone-400 sm:inline">{user.email}</span>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {membership ? (
          <DashboardClient workspaceId={membership.workspace_id} />
        ) : (
          <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 p-12 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No workspace found. Please sign out and sign in again.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
