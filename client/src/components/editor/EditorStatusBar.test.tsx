import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EDITOR_UI } from "@constants/messages";

import EditorStatusBar from "./EditorStatusBar";

describe("EditorStatusBar", () => {
  it("shows new post label when nothing saved and clean", () => {
    render(
      <EditorStatusBar wordCount={0} characterCount={0} readingTimeMinutes={0} lastSavedAt={null} isDirty={false} />,
    );
    expect(screen.getByText(EDITOR_UI.STATUS_NEW_POST)).toBeInTheDocument();
  });

  it("shows not saved yet when dirty without lastSavedAt", () => {
    render(
      <EditorStatusBar wordCount={12} characterCount={48} readingTimeMinutes={0} lastSavedAt={null} isDirty={true} />,
    );
    expect(screen.getByText(EDITOR_UI.STATUS_NOT_SAVED_YET)).toBeInTheDocument();
    expect(screen.getByText(EDITOR_UI.WORD_COUNT_LABEL("12"))).toBeInTheDocument();
  });

  it("shows saved time when clean and hides read time at zero", () => {
    const saved = new Date("2026-01-15T14:30:00");
    render(
      <EditorStatusBar
        wordCount={100}
        characterCount={500}
        readingTimeMinutes={0}
        lastSavedAt={saved}
        isDirty={false}
      />,
    );
    expect(screen.getByText(EDITOR_UI.STATUS_SAVED_AT(saved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })))).toBeInTheDocument();
    expect(screen.queryByText(/min read/i)).not.toBeInTheDocument();
  });

  it("shows unsaved changes and read time when applicable", () => {
    const saved = new Date("2026-01-15T09:00:00");
    render(
      <EditorStatusBar wordCount={200} characterCount={900} readingTimeMinutes={3} lastSavedAt={saved} isDirty={true} />,
    );
    expect(screen.getByText(EDITOR_UI.STATUS_UNSAVED_CHANGES)).toBeInTheDocument();
    expect(screen.getByText(EDITOR_UI.READ_TIME_LABEL(3))).toBeInTheDocument();
  });
});
