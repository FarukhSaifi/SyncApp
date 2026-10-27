import { describe, expect, it } from "vitest";

import { isMermaidSource } from "./mermaidDetect";

describe("isMermaidSource", () => {
  it("returns true for explicit mermaid language", () => {
    expect(isMermaidSource("mermaid", "not a diagram")).toBe(true);
  });

  it("detects flowchart source without language", () => {
    expect(isMermaidSource(null, "flowchart TD\n  A-->B")).toBe(true);
  });

  it("returns false for ordinary code", () => {
    expect(isMermaidSource("ts", "const x = 1")).toBe(false);
  });
});
