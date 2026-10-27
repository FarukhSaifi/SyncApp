import { AppError } from "@middleware/errorHandler";
import { describe, expect, it } from "vitest";


import { parseGeneratePostResponse } from "./schemas";

describe("parseGeneratePostResponse", () => {
  it("parses fenced JSON into GeneratePostResult", () => {
    const raw = `\`\`\`json
{"title":"My Post Title Here","content_markdown":"## Intro\\n\\nBody","meta_description":"Meta","tags":["DevOps"]}
\`\`\``;
    const result = parseGeneratePostResponse(raw);
    expect(result.title).toBe("My Post Title Here");
    expect(result.content).toContain("Intro");
    expect(result.tags).toContain("devops");
  });

  it("throws AppError when title or content missing", () => {
    expect(() => parseGeneratePostResponse('{"title":"","content_markdown":""}')).toThrow(AppError);
  });

  it("finalizes LinkedIn post when includeLinkedIn", () => {
    const raw = JSON.stringify({
      title: "LinkedIn ready title",
      content_markdown: "Body",
      linkedin_post: "Teaser\n\n#tag",
    });
    const result = parseGeneratePostResponse(raw, { includeLinkedIn: true });
    expect(result.linkedin_post).toContain("Teaser");
  });
});
