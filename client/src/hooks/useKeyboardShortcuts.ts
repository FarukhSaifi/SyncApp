/**
 * useKeyboardShortcuts — Registers global keyboard shortcuts for the editor.
 * Ctrl/Cmd+S  → save (preserves published status)
 * Ctrl/Cmd+Shift+P → toggle preview
 * Escape → onEscape callback (close sidebar on mobile)
 */
import { useEffect } from "react";

import type { ShortcutHandlers } from "@types";

export function useKeyboardShortcuts({ onSave, onTogglePreview, onEscape }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + S → Save
      if (metaOrCtrl && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl/Cmd + Shift + P → Toggle preview
      if (metaOrCtrl && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onTogglePreview?.();
        return;
      }

      // Escape
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave, onTogglePreview, onEscape]);
}
