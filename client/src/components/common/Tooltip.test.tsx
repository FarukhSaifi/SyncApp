import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows inline tooltip on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Help text">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole("button", { name: "Trigger" }));
    expect(await screen.findByText("Help text")).toBeInTheDocument();
  });

  it("renders portal tooltip when portal mode enabled", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Portal tip" portal side="bottom">
        <span>Hover me</span>
      </Tooltip>,
    );
    await user.hover(screen.getByText("Hover me"));
    expect(await screen.findByText("Portal tip")).toBeInTheDocument();
  });

  it("shows portal tooltip on focus and supports left side", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Left tip" portal side="left">
        <button type="button">Focus me</button>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByText("Left tip")).toBeInTheDocument();
  });
});
