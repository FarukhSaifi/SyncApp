import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SuggestionError from "./SuggestionError";

describe("SuggestionError", () => {
  it("renders alert with message", () => {
    render(<SuggestionError message="Could not load suggestions" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load suggestions");
    expect(alert.className).toContain("border-destructive");
  });
});
