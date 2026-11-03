import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EditorMobileSheet from "./EditorMobileSheet";

describe("EditorMobileSheet", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <EditorMobileSheet isOpen={false} title="Panel" closeAriaLabel="Close" onClose={vi.fn()}>
        Body
      </EditorMobileSheet>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog and closes on button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditorMobileSheet isOpen title="Post settings" closeAriaLabel="Close panel" onClose={onClose}>
        <p>Sheet body</p>
      </EditorMobileSheet>,
    );
    expect(screen.getByRole("dialog", { name: "Post settings" })).toBeInTheDocument();
    expect(screen.getByText("Sheet body")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close panel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditorMobileSheet isOpen title="Panel" closeAriaLabel="Close" onClose={onClose}>
        Body
      </EditorMobileSheet>,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
