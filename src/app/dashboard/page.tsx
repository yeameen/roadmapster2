import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Roadmapster
            </h1>
            {workspaceName && (
              <p className="text-sm text-gray-500">{workspaceName}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {membership ? (
          <DashboardClient workspaceId={membership.workspace_id} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">
              No workspace found. Please sign out and sign in again.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
