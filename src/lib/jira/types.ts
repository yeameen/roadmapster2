export type JiraIssueFields = {
  summary: string;
  description: unknown; // ADF (Atlassian Document Format)
  assignee: { displayName: string } | null;
  priority: { name: string } | null;
  status: { name: string; statusCategory: { key: string } };
  issuetype: { name: string };
  customfield_10016: number | null; // story points
};

export type JiraIssue = {
  id: string;
  key: string;
  self: string;
  fields: JiraIssueFields;
};

export type JiraSearchResponse = {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
};

export type JiraProject = {
  id: string;
  key: string;
  name: string;
};
