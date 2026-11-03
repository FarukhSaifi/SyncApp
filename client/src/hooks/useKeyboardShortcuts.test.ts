import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KEYBOARD_KEYS } from "@constants/designTokens";

import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  it("invokes save, preview toggle, and escape handlers", () => {
    const onSave = vi.fn();
    const onTogglePreview = vi.fn();
    const onEscape = vi.fn();

    renderHook(() => useKeyboardShortcuts({ onSave, onTogglePreview, onEscape }));

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
    expect(onSave).toHaveBeenCalledTimes(1);

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "P", ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(onTogglePreview).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: KEYBOARD_KEYS.ESCAPE, bubbles: true }));
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});
