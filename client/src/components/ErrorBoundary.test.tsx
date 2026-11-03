import React from "react";

import { SYNC_LABEL } from "@constants";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

function Boom(): React.ReactElement {
  throw new Error("render failed");
}

describe("ErrorBoundary", () => {
  it("renders fallback when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(SYNC_LABEL.SOMETHING_WENT_WRONG)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SYNC_LABEL.GO_TO_DASHBOARD })).toBeInTheDocument();
  });
});
