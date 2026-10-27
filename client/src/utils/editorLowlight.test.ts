import { describe, expect, it } from "vitest";

import lowlight from "./editorLowlight";

describe("editorLowlight", () => {
  it("registers common language aliases", () => {
    expect(lowlight.listLanguages()).toContain("javascript");
    expect(lowlight.listLanguages()).toContain("typescript");
  });

  it("highlights a javascript snippet", () => {
    const tree = lowlight.highlight("javascript", "const x = 1;");
    expect(tree).toBeTruthy();
    expect(JSON.stringify(tree)).toContain("const");
  });
});
