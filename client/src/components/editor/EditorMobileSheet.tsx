"use client";

import { useEffect } from "react";

import type { EditorMobileSheetProps } from "@types";
import { FiX } from "react-icons/fi";

import { KEYBOARD_KEYS, MODAL_BODY_OVERFLOW } from "@constants/designTokens";
import { EDITOR_DRAWER } from "@constants/editor";

/**
 * Full-viewport sheet for editor panels on &lt;lg.
 * Better than a side drawer for long Post Settings / Publish & AI forms,
 * and better than a centered dialog which clips scrollable sections.
 */
const EditorMobileSheet = ({ isOpen, title, closeAriaLabel, onClose, children }: EditorMobileSheetProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_KEYS["ESCAPE"]) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = MODAL_BODY_OVERFLOW["HIDDEN"];

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = MODAL_BODY_OVERFLOW["UNSET"];
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="editor-mobile-sheet-root" role="presentation">
      <div className="editor-mobile-sheet-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex h-full min-h-0 flex-col">
          <div className={EDITOR_DRAWER["TITLE_BAR_CLASS"]}>
            <h2 className={EDITOR_DRAWER["TITLE_CLASS"]}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className={EDITOR_DRAWER["CLOSE_BUTTON_CLASS"]}
              aria-label={closeAriaLabel}
            >
              <FiX className={EDITOR_DRAWER["CLOSE_ICON_CLASS"]} />
            </button>
          </div>
          <div className={EDITOR_DRAWER["BODY_CLASS"]}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default EditorMobileSheet;
