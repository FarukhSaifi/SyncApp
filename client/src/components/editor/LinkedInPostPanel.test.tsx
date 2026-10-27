import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EDITOR_UI } from "@constants/messages";

import LinkedInPostPanel from "./LinkedInPostPanel";

describe("LinkedInPostPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows empty state generate action", async () => {
    const onGenerate = vi.fn();
    render(
      <LinkedInPostPanel
        linkedinPost={null}
        linkedinReadMoreUrl={null}
        linkedinMissingCanonical={false}
        linkedinConnected
        onGenerate={onGenerate}
        onCopy={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["LINKEDIN_POST_GENERATE"] }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("renders populated post with copy and publish actions", async () => {
    const onCopy = vi.fn();
    const onPublish = vi.fn();
    render(
      <LinkedInPostPanel
        linkedinPost="Hello LinkedIn"
        linkedinReadMoreUrl="https://example.com/post"
        linkedinMissingCanonical={false}
        linkedinConnected
        onGenerate={vi.fn()}
        onCopy={onCopy}
        onPublish={onPublish}
      />,
    );
    expect(screen.getByText("Hello LinkedIn")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["LINKEDIN_POST_COPY"] }));
    expect(onCopy).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: EDITOR_UI["LINKEDIN_POST_PUBLISH"] }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("shows canonical warning and connect hint", () => {
    render(
      <LinkedInPostPanel
        linkedinPost="Draft"
        linkedinReadMoreUrl={null}
        linkedinMissingCanonical
        linkedinConnected={false}
        onGenerate={vi.fn()}
        onCopy={vi.fn()}
        onPublish={vi.fn()}
      />,
    );
    expect(screen.getByText(EDITOR_UI["LINKEDIN_POST_MISSING_CANONICAL"])).toBeInTheDocument();
  });
});
