import { INFO_MESSAGES } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import LoadingScreen from "./LoadingScreen";

describe("LoadingScreen", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders full-page spinner with default message", () => {
    render(<LoadingScreen />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(INFO_MESSAGES.LOADING);
    expect(status.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders inline variant without spinner", () => {
    render(<LoadingScreen inline message="Saving…" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Saving…");
    expect(status.querySelector(".animate-spin")).not.toBeInTheDocument();
  });
});
