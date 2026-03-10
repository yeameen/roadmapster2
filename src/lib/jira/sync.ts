import { createAdminClient } from "@/lib/supabase/admin";
import { getJiraAccessToken } from "@/lib/jira/auth";
import { jiraFetch } from "@/lib/jira/client";
import { suggestSizeFromPoints, mapJiraPriority, mapStatusCategory } from "@/lib/jira/constants";
import { adfToPlainText } from "@/lib/jira/adf";
import type { JiraSearchResponse, JiraIssue } from "@/lib/jira/types";

type SyncResult = {
  created: number;
  updated: number;
  unlinked: number;
  stories: number;
};

/**
 * Fetch all issues matching a JQL query, paginating through results.
 */
async function fetchAllIssues(
  cloudId: string,
  accessToken: string,
  jql: string
): Promise<JiraIssue[]> {
  const allIssues: JiraIssue[] = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const params = new URLSearchParams({
      jql,
      startAt: String(startAt),
      maxResults: String(maxResults),
      fields:
        "summary,description,assignee,priority,status,issuetype,customfield_10016",
    });

    const response = await jiraFetch(
      cloudId,
      accessToken,
      `/rest/api/3/search?${params.toString()}`
    );

    const data = (await response.json()) as JiraSearchResponse;
    allIssues.push(...data.issues);

    if (startAt + data.maxResults >= data.total) {
      break;
    }
    startAt += data.maxResults;
  }

  return allIssues;
}

/**
 * Sync a team's epics and child stories from Jira.
 *
 * 1. Reads the team's Jira mapping and connection
 * 2. Fetches epics from Jira (using JQL or project key)
 * 3. Creates/updates/unlinks epics in the DB
 * 4. For each synced epic, fetches and upserts child stories
 */
export async function syncTeamFromJira(
  teamId: string
): Promise<SyncResult> {
  const admin = createAdminClient();

  // 1. Fetch team mapping
  const { data: mapping, error: mappingError } = await admin
    .from("jira_team_mappings")
    .select("*")
    .eq("team_id", teamId)
    .single();

  if (mappingError || !mapping) {
    throw new Error(
      `No Jira team mapping found for team ${teamId}`
    );
  }

  // 2. Set sync status
  await admin
    .from("jira_team_mappings")
    .update({ sync_status: "syncing", sync_error: null })
    .eq("id", mapping.id);

  try {
    // 3. Get workspace_id from team, then get jira connection
    const { data: team, error: teamError } = await admin
      .from("teams")
      .select("workspace_id")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const { data: connection, error: connError } = await admin
      .from("jira_connections")
      .select("atlassian_cloud_id, atlassian_site_url")
      .eq("workspace_id", team.workspace_id)
      .single();

    if (connError || !connection) {
      throw new Error(
        `No Jira connection found for workspace ${team.workspace_id}`
      );
    }

    const accessToken = await getJiraAccessToken(team.workspace_id);
    const cloudId = connection.atlassian_cloud_id;
    const siteUrl = connection.atlassian_site_url;

    // 4. Build JQL
    let jql: string;
    if (mapping.jira_filter_jql) {
      jql = mapping.jira_filter_jql;
    } else if (mapping.jira_project_key) {
      jql = `project = ${mapping.jira_project_key} AND issuetype = ${mapping.epic_issue_type} ORDER BY rank ASC`;
    } else {
      throw new Error(
        "Jira mapping has neither jira_filter_jql nor jira_project_key"
      );
    }

    // 5. Fetch all epics from Jira
    const jiraEpics = await fetchAllIssues(cloudId, accessToken, jql);

    // 6. Get existing epics with jira keys for this team
    const { data: existingEpics, error: existingError } = await admin
      .from("epics")
      .select("id, jira_epic_key, size_override, position")
      .eq("team_id", teamId)
      .not("jira_epic_key", "is", null);

    if (existingError) {
      throw new Error(
        `Failed to fetch existing epics: ${existingError.message}`
      );
    }

    const existingByKey = new Map(
      (existingEpics ?? []).map((e) => [e.jira_epic_key, e])
    );

    // Get max position for new inserts
    const { data: maxPosRow } = await admin
      .from("epics")
      .select("position")
      .eq("team_id", teamId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    let nextPosition = (maxPosRow?.position ?? 0) + 1;

    const jiraKeysSeen = new Set<string>();
    let created = 0;
    let updated = 0;

    // 7. Process each Jira epic
    for (const jiraEpic of jiraEpics) {
      jiraKeysSeen.add(jiraEpic.key);

      const points = jiraEpic.fields.customfield_10016;
      const existing = existingByKey.get(jiraEpic.key);
      const jiraUrl = `${siteUrl}/browse/${jiraEpic.key}`;

      if (existing) {
        // Update existing epic
        const updateData: Record<string, unknown> = {
          title: jiraEpic.fields.summary,
          description: adfToPlainText(jiraEpic.fields.description),
          story_points: points,
          owner: jiraEpic.fields.assignee?.displayName ?? null,
          priority: mapJiraPriority(
            jiraEpic.fields.priority?.name ?? null
          ),
          jira_epic_id: jiraEpic.id,
          jira_url: jiraUrl,
          last_synced_at: new Date().toISOString(),
        };

        // Only update size if not overridden
        if (!existing.size_override) {
          updateData.size = suggestSizeFromPoints(points);
        }

        await admin.from("epics").update(updateData).eq("id", existing.id);
        updated++;
      } else {
        // Insert new epic
        await admin.from("epics").insert({
          team_id: teamId,
          title: jiraEpic.fields.summary,
          description: adfToPlainText(jiraEpic.fields.description),
          size: suggestSizeFromPoints(points),
          priority: mapJiraPriority(
            jiraEpic.fields.priority?.name ?? null
          ),
          quarter_id: null,
          position: nextPosition++,
          owner: jiraEpic.fields.assignee?.displayName ?? null,
          jira_epic_id: jiraEpic.id,
          jira_epic_key: jiraEpic.key,
          jira_url: jiraUrl,
          story_points: points,
          size_override: false,
          last_synced_at: new Date().toISOString(),
        });
        created++;
      }
    }

    // 8. Unlink epics no longer in Jira
    let unlinked = 0;
    for (const [key, epic] of existingByKey) {
      if (!jiraKeysSeen.has(key!)) {
        await admin
          .from("epics")
          .update({
            jira_epic_id: null,
            jira_epic_key: null,
            jira_url: null,
            story_points: null,
            last_synced_at: null,
            size_override: false,
          })
          .eq("id", epic.id);
        unlinked++;
      }
    }

    // 9. Sync child stories for each synced epic
    let totalStories = 0;

    // Re-fetch all synced epics to get IDs for story association
    const { data: syncedEpics } = await admin
      .from("epics")
      .select("id, jira_epic_key")
      .eq("team_id", teamId)
      .not("jira_epic_key", "is", null);

    for (const epic of syncedEpics ?? []) {
      const storyJql = `"Epic Link" = ${epic.jira_epic_key} OR parent = ${epic.jira_epic_key} ORDER BY rank ASC`;

      const jiraStories = await fetchAllIssues(
        cloudId,
        accessToken,
        storyJql
      );

      const jiraStoryKeysSeen = new Set<string>();

      for (const story of jiraStories) {
        jiraStoryKeysSeen.add(story.key);
        const storyUrl = `${siteUrl}/browse/${story.key}`;

        const storyData = {
          epic_id: epic.id,
          jira_issue_id: story.id,
          jira_issue_key: story.key,
          title: story.fields.summary,
          status: story.fields.status.name,
          status_category: mapStatusCategory(
            story.fields.status.statusCategory.key
          ),
          assignee: story.fields.assignee?.displayName ?? null,
          story_points: story.fields.customfield_10016,
          issue_type: story.fields.issuetype.name,
          jira_url: storyUrl,
        };

        // Upsert by jira_issue_key
        const { data: existingStory } = await admin
          .from("jira_stories")
          .select("id")
          .eq("jira_issue_key", story.key)
          .single();

        if (existingStory) {
          await admin
            .from("jira_stories")
            .update(storyData)
            .eq("id", existingStory.id);
        } else {
          await admin.from("jira_stories").insert(storyData);
        }

        totalStories++;
      }

      // Delete stories from DB that are no longer in Jira
      const { data: existingStories } = await admin
        .from("jira_stories")
        .select("id, jira_issue_key")
        .eq("epic_id", epic.id);

      for (const dbStory of existingStories ?? []) {
        if (!jiraStoryKeysSeen.has(dbStory.jira_issue_key)) {
          await admin.from("jira_stories").delete().eq("id", dbStory.id);
        }
      }
    }

    // 10. Update mapping — success
    await admin
      .from("jira_team_mappings")
      .update({
        sync_status: "idle",
        last_synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq("id", mapping.id);

    return { created, updated, unlinked, stories: totalStories };
  } catch (error) {
    // 11. Update mapping — error
    const message =
      error instanceof Error ? error.message : String(error);

    await admin
      .from("jira_team_mappings")
      .update({
        sync_status: "error",
        sync_error: message,
      })
      .eq("id", mapping.id);

    throw error;
  }
}
