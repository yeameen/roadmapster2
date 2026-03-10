/**
 * Convert Atlassian Document Format (ADF) JSON to plain text.
 *
 * ADF is a tree of nodes with `type`, optional `text`, and optional `content` arrays.
 * We recursively walk the tree extracting text, joining block-level nodes with newlines.
 */

type AdfNode = {
  type: string;
  text?: string;
  content?: AdfNode[];
};

function extractText(node: AdfNode): string {
  // Text leaf node
  if (node.type === "text" && node.text !== undefined) {
    return node.text;
  }

  // No children — nothing to extract
  if (!node.content || !Array.isArray(node.content)) {
    return "";
  }

  // Block-level types that should be separated by newlines
  const blockTypes = new Set([
    "paragraph",
    "heading",
    "blockquote",
    "codeBlock",
    "rule",
    "mediaSingle",
    "decisionList",
    "taskList",
  ]);

  // For list items and table cells, join children with newlines
  const isContainer =
    node.type === "listItem" ||
    node.type === "tableRow" ||
    node.type === "tableCell" ||
    node.type === "tableHeader";

  if (blockTypes.has(node.type) || isContainer) {
    return node.content.map(extractText).filter(Boolean).join("");
  }

  // Lists: join items with newlines
  if (
    node.type === "bulletList" ||
    node.type === "orderedList"
  ) {
    return node.content.map(extractText).filter(Boolean).join("\n");
  }

  // Document root or other container — join blocks with newlines
  return node.content.map(extractText).filter(Boolean).join("\n");
}

/**
 * Convert an ADF document (or null/undefined) to plain text.
 * Returns empty string for falsy inputs.
 */
export function adfToPlainText(adf: unknown): string {
  if (!adf || typeof adf !== "object") {
    return "";
  }

  const doc = adf as AdfNode;

  if (!doc.type || !doc.content || !Array.isArray(doc.content)) {
    return "";
  }

  return extractText(doc);
}
