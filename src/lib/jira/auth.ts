import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "./encryption";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves a valid Jira access token for the given workspace.
 * Automatically refreshes the token if it expires within 5 minutes.
 */
export async function getJiraAccessToken(
  workspaceId: string
): Promise<string> {
  const admin = createAdminClient();

  const { data: connection, error } = await admin
    .from("jira_connections")
    .select(
      "id, access_token, refresh_token, token_expires_at"
    )
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !connection) {
    throw new Error(
      `No Jira connection found for workspace ${workspaceId}`
    );
  }

  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();

  // If token is still valid (with buffer), decrypt and return
  if (expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
    return decrypt(connection.access_token);
  }

  // Token is expired or about to expire — refresh it
  const refreshToken = decrypt(connection.refresh_token);
  const response = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: process.env.ATLASSIAN_CLIENT_ID,
      client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to refresh Jira token: ${response.status} ${body}`);
  }

  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const { error: updateError } = await admin
    .from("jira_connections")
    .update({
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(tokens.refresh_token),
      token_expires_at: newExpiresAt,
    })
    .eq("id", connection.id);

  if (updateError) {
    throw new Error(
      `Failed to persist refreshed Jira tokens: ${updateError.message}`
    );
  }

  return tokens.access_token;
}
