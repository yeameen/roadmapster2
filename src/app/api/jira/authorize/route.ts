import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";

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

  const state = randomBytes(32).toString("hex");
  const cookieValue = `${state}:${workspaceId}`;

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/jira/callback`;
  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: process.env.ATLASSIAN_CLIENT_ID!,
    scope: "read:jira-work offline_access",
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    prompt: "consent",
  });

  const authorizeUrl = `https://auth.atlassian.com/authorize?${params.toString()}`;

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("jira_oauth_state", cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
}
