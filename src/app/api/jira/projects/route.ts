import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getJiraAccessToken } from "@/lib/jira/auth";

type JiraProject = {
  id: string;
  key: string;
  name: string;
};

type JiraProjectSearchResponse = {
  values: JiraProject[];
  isLast: boolean;
  startAt: number;
  maxResults: number;
  total: number;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId query parameter is required" },
      { status: 400 }
    );
  }

  // Get access token (auto-refreshes if needed)
  let accessToken: string;
  try {
    accessToken = await getJiraAccessToken(workspaceId);
  } catch (err) {
    console.error("Failed to get Jira access token:", err);
    return NextResponse.json(
      { error: "Failed to get Jira access token" },
      { status: 500 }
    );
  }

  // Get cloud ID from the connection
  const admin = createAdminClient();
  const { data: connection, error: connError } = await admin
    .from("jira_connections")
    .select("atlassian_cloud_id")
    .eq("workspace_id", workspaceId)
    .single();

  if (connError || !connection) {
    return NextResponse.json(
      { error: "No Jira connection found" },
      { status: 404 }
    );
  }

  // Fetch all projects with pagination
  const allProjects: Array<{ key: string; name: string; id: string }> = [];
  let startAt = 0;
  const maxResults = 50;
  let isLast = false;

  while (!isLast) {
    const url = `https://api.atlassian.com/ex/jira/${connection.atlassian_cloud_id}/rest/api/3/project/search?startAt=${startAt}&maxResults=${maxResults}`;
    const projectsResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!projectsResponse.ok) {
      console.error(
        "Failed to fetch Jira projects:",
        projectsResponse.status,
        await projectsResponse.text()
      );
      return NextResponse.json(
        { error: "Failed to fetch Jira projects" },
        { status: 502 }
      );
    }

    const data = (await projectsResponse.json()) as JiraProjectSearchResponse;

    for (const project of data.values) {
      allProjects.push({
        key: project.key,
        name: project.name,
        id: project.id,
      });
    }

    isLast = data.isLast;
    startAt += maxResults;
  }

  return NextResponse.json({ projects: allProjects });
}
