import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

test.describe("Milestone 1: Schema & App Bootstrap", () => {
  test("database has all 7 tables from the migration", async () => {
    const tables = [
      "workspaces",
      "workspace_members",
      "teams",
      "planning_members",
      "quarters",
      "quarter_members",
      "epics",
    ];

    for (const table of tables) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`,
        { headers: supabaseHeaders(SERVICE_ROLE_KEY) }
      );
      expect(res.status, `Table '${table}' should be accessible`).toBe(200);
    }
  });

  test("epics table enforces size constraint", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/epics`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(SERVICE_ROLE_KEY),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        team_id: "00000000-0000-0000-0000-000000000000",
        title: "Test",
        size: "INVALID",
        priority: "P0",
      }),
    });
    // Should fail due to CHECK constraint on size
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("epics table enforces priority constraint", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/epics`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(SERVICE_ROLE_KEY),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        team_id: "00000000-0000-0000-0000-000000000000",
        title: "Test",
        size: "M",
        priority: "P99",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("quarters table enforces status constraint", async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/quarters`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(SERVICE_ROLE_KEY),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        team_id: "00000000-0000-0000-0000-000000000000",
        name: "Test",
        status: "invalid_status",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("RLS helper functions exist and return empty for unknown user", async () => {
    const functions = ["user_workspace_ids", "user_team_ids", "user_quarter_ids"];
    const fakeUuid = "00000000-0000-0000-0000-000000000000";

    for (const fn of functions) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: supabaseHeaders(SERVICE_ROLE_KEY),
        body: JSON.stringify({ user_uuid: fakeUuid }),
      });
      expect(res.status, `Function '${fn}' should exist`).toBe(200);
      const data = await res.json();
      expect(data, `Function '${fn}' should return empty for unknown user`).toEqual([]);
    }
  });

  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });

  test("app home page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    // Should either show the home page or redirect to login
    await page.waitForLoadState("networkidle");

    // No JS errors
    expect(errors).toEqual([]);
  });

  test("RLS blocks anonymous access to tables", async () => {
    const ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

    const tables = ["workspaces", "teams", "epics", "quarters"];

    for (const table of tables) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=id`,
        { headers: supabaseHeaders(ANON_KEY) }
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data, `Anonymous should see no rows in '${table}'`).toEqual([]);
    }
  });
});
