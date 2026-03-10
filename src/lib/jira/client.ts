const BASE_URL = "https://api.atlassian.com/ex/jira";
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Fetch wrapper for the Jira Cloud REST API.
 *
 * - Prepends the base URL with the cloud ID
 * - Adds Bearer authorization and Accept headers
 * - Retries on 429 (rate limit) with exponential backoff (max 3 retries)
 * - Throws on non-OK responses (after exhausting retries for 429s)
 */
export async function jiraFetch(
  cloudId: string,
  accessToken: string,
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${BASE_URL}/${cloudId}${path}`;

  const headers = new Headers(options?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");

  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status !== 429) {
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Jira API error: ${response.status} ${response.statusText} — ${body}`
        );
      }
      return response;
    }

    // Rate limited — retry with exponential backoff
    lastResponse = response;

    if (attempt < MAX_RETRIES) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const backoffMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : INITIAL_BACKOFF_MS * Math.pow(2, attempt);

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // Exhausted retries on 429
  throw new Error(
    `Jira API rate limited after ${MAX_RETRIES} retries: ${lastResponse?.status} ${lastResponse?.statusText}`
  );
}
