import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_UI, ERROR_MESSAGES, VALIDATION_MESSAGES } from "@constants/messages";

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  apiError: vi.fn(),
  apiSuccess: vi.fn(),
  validationError: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

vi.mock("@utils/apiClient", () => ({
  apiClient: {
    aiEdit: vi.fn(),
  },
}));

import { AIToolkitDropdown } from "./AIToolkitDropdown";

function buildEditor(selectionText: string, selected = true) {
  const from = selected ? 0 : 0;
  const to = selected ? selectionText.length : 0;
  const chainRun = vi.fn();
  const insertContent = vi.fn().mockReturnValue({ run: chainRun });
  const deleteRange = vi.fn().mockReturnValue({ insertContent });
  return {
    state: {
      selection: {
        from,
        to,
        $from: {
          parent: { textContent: selectionText },
          before: () => 0,
          after: () => selectionText.length + 2,
        },
      },
      doc: {
        textBetween: () => selectionText,
      },
    },
    chain: () => ({
      focus: () => ({
        insertContent,
        deleteRange,
        run: chainRun,
      }),
    }),
    _chainRun: chainRun,
  };
}

describe("AIToolkitDropdown", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to onAction when provided", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<AIToolkitDropdown onAction={onAction} />);
    const [trigger] = screen.getAllByRole("button", { name: new RegExp(EDITOR_UI.AI_TOOLKIT_TRIGGER, "i") });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_PROOFREAD }));
    expect(onAction).toHaveBeenCalledWith("proofread");
  });

  it("opens toolkit menu with AI actions", async () => {
    const user = userEvent.setup();
    render(<AIToolkitDropdown onAction={vi.fn()} />);
    const [trigger] = screen.getAllByRole("button", { name: new RegExp(EDITOR_UI.AI_TOOLKIT_TRIGGER, "i") });
    await user.click(trigger);
    expect(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_ADD_COMMENT })).toBeVisible();
    expect(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_ADJUST_SELECTION })).toBeVisible();
  });

  it("shows validation error when editor content is empty", async () => {
    const user = userEvent.setup();
    const editor = buildEditor("   ", false);
    render(<AIToolkitDropdown editor={editor as never} />);
    const [trigger] = screen.getAllByRole("button", { name: new RegExp(EDITOR_UI.AI_TOOLKIT_TRIGGER, "i") });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_PROOFREAD }));
    expect(toast.validationError).toHaveBeenCalledWith(VALIDATION_MESSAGES.EDITOR_CONTENT_OR_SELECTION_REQUIRED);
  });

  it("runs aiEdit for selection and inserts result", async () => {
    const user = userEvent.setup();
    const editor = buildEditor("Fix me");
    vi.mocked(apiClient.aiEdit).mockResolvedValue({
      success: true,
      data: { result: "Fixed text" },
    });
    render(<AIToolkitDropdown editor={editor as never} />);
    const [trigger] = screen.getAllByRole("button", { name: new RegExp(EDITOR_UI.AI_TOOLKIT_TRIGGER, "i") });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_PROOFREAD }));
    await waitFor(() => {
      expect(apiClient.aiEdit).toHaveBeenCalled();
    });
    expect(toast.apiSuccess).toHaveBeenCalled();
    expect(editor._chainRun).toHaveBeenCalled();
  });

  it("errors when editor is missing", async () => {
    const user = userEvent.setup();
    render(<AIToolkitDropdown />);
    const [trigger] = screen.getAllByRole("button", { name: new RegExp(EDITOR_UI.AI_TOOLKIT_TRIGGER, "i") });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: EDITOR_UI.AI_TOOLKIT_PROOFREAD }));
    expect(toast.error).toHaveBeenCalledWith(ERROR_MESSAGES.EDITOR_NOT_INITIALIZED);
  });
});
