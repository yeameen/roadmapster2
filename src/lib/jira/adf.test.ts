import { describe, it, expect } from "vitest";
import { adfToPlainText } from "./adf";

describe("adfToPlainText", () => {
  it("returns empty string for null", () => {
    expect(adfToPlainText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(adfToPlainText(undefined)).toBe("");
  });

  it("returns empty string for non-object input", () => {
    expect(adfToPlainText("hello")).toBe("");
    expect(adfToPlainText(42)).toBe("");
    expect(adfToPlainText(true)).toBe("");
  });

  it("returns empty string for empty document", () => {
    expect(
      adfToPlainText({
        version: 1,
        type: "doc",
        content: [],
      })
    ).toBe("");
  });

  it("returns empty string for object without type", () => {
    expect(adfToPlainText({ content: [] })).toBe("");
  });

  it("returns empty string for object without content", () => {
    expect(adfToPlainText({ type: "doc" })).toBe("");
  });

  it("extracts text from a simple paragraph", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("Hello world");
  });

  it("joins multiple paragraphs with newlines", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Second paragraph" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("First paragraph\nSecond paragraph");
  });

  it("extracts text from a bullet list", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item one" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Item two" }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("Item one\nItem two");
  });

  it("extracts text from an ordered list", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second" }],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("First\nSecond");
  });

  it("extracts text from a code block", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "codeBlock",
          attrs: { language: "javascript" },
          content: [{ type: "text", text: "const x = 1;" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("const x = 1;");
  });

  it("extracts text from inline marks (bold, italic) — just the text", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "bold text",
              marks: [{ type: "strong" }],
            },
            { type: "text", text: " and " },
            {
              type: "text",
              text: "italic text",
              marks: [{ type: "em" }],
            },
          ],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("bold text and italic text");
  });

  it("handles nested content (list inside blockquote)", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Quoted text" }],
            },
          ],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("Quoted text");
  });

  it("handles multiple inline text nodes in a paragraph", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world" },
          ],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("Hello world");
  });

  it("handles heading nodes", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "My Heading" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Body text" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("My Heading\nBody text");
  });

  it("handles mixed block types", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Title" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Intro text" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bullet A" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Bullet B" }],
                },
              ],
            },
          ],
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: "code();" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe(
      "Title\nIntro text\nBullet A\nBullet B\ncode();"
    );
  });

  it("skips nodes with no text content", () => {
    const adf = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Before" }],
        },
        {
          type: "rule",
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "After" }],
        },
      ],
    };
    expect(adfToPlainText(adf)).toBe("Before\nAfter");
  });
});
