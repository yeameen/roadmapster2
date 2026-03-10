import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/jira/encryption";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=unauthorized`
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=missing_params`
    );
  }

  // Validate state against cookie
  const stateCookie = request.cookies.get("jira_oauth_state")?.value;
  if (!stateCookie) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=missing_state_cookie`
    );
  }

  const separatorIndex = stateCookie.indexOf(":");
  if (separatorIndex === -1) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=invalid_state_cookie`
    );
  }

  const savedState = stateCookie.substring(0, separatorIndex);
  const workspaceId = stateCookie.substring(separatorIndex + 1);

  if (state !== savedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=state_mismatch`
    );
  }

  // Exchange code for tokens
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/jira/callback`;
  const tokenResponse = await fetch(
    "https://auth.atlassian.com/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    console.error("Jira token exchange failed:", tokenResponse.status, body);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=token_exchange_failed`
    );
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
  };

  // Fetch accessible resources to get cloud ID and site URL
  const resourcesResponse = await fetch(
    "https://api.atlassian.com/oauth/token/accessible-resources",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );

  if (!resourcesResponse.ok) {
    console.error(
      "Failed to fetch Jira accessible resources:",
      resourcesResponse.status
    );
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=resources_fetch_failed`
    );
  }

  const resources = (await resourcesResponse.json()) as Array<{
    id: string;
    url: string;
    name: string;
    scopes: string[];
  }>;

  if (resources.length === 0) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=no_accessible_resources`
    );
  }

  // Use the first accessible resource
  const resource = resources[0];
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const scopes = tokens.scope ? tokens.scope.split(" ") : [];

  // Upsert connection using admin client
  const admin = createAdminClient();
  const { error: upsertError } = await admin
    .from("jira_connections")
    .upsert(
      {
        workspace_id: workspaceId,
        atlassian_cloud_id: resource.id,
        atlassian_site_url: resource.url,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        token_expires_at: expiresAt,
        scopes,
        connected_by: user.id,
      },
      { onConflict: "workspace_id" }
    );

  if (upsertError) {
    console.error("Failed to save Jira connection:", upsertError);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?jira_error=save_failed`
    );
  }

  // Clear the state cookie and redirect to dashboard
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
  );
  response.cookies.delete("jira_oauth_state");

  return response;
}
