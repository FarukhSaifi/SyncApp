import { TEST_IDS } from "@constants";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SYNC_LABEL } from "@constants/messages";

import EditorToolbar from "./EditorToolbar";

describe("EditorToolbar", () => {
  it("exposes TipTap save control via data-testid and invokes onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <EditorToolbar
        isEditing
        activeTab="edit"
        onTogglePreview={vi.fn()}
        onSave={onSave}
        onBack={vi.fn()}
        loading={false}
        isDirty
        wordCount={12}
        onToggleLeftSidebar={vi.fn()}
        onToggleRightSidebar={vi.fn()}
      />,
    );
    const save = screen.getByTestId(TEST_IDS.EDITOR_SAVE);
    expect(save).toHaveTextContent(SYNC_LABEL["SAVE_POST"]);
    await user.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
