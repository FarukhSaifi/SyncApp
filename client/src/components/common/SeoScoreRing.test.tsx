import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SeoScoreRing from "./SeoScoreRing";

describe("SeoScoreRing", () => {
  it("renders score text", () => {
    render(<SeoScoreRing score={72} maxScore={100} />);
    expect(screen.getByText("72")).toBeInTheDocument();
  });
});
