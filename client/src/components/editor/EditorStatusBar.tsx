import React from "react";

import type { EditorStatusBarProps } from "@types";

import { EDITOR_UI } from "@constants/messages";

const EditorStatusBar = ({
  wordCount,
  characterCount,
  readingTimeMinutes,
  lastSavedAt,
  isDirty,
}: EditorStatusBarProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="editor-statusbar editor-statusbar-bar">
      <div className="flex items-center gap-4">
        {lastSavedAt ? (
          <span>
            {isDirty ? EDITOR_UI.STATUS_UNSAVED_CHANGES : EDITOR_UI.STATUS_SAVED_AT(formatTime(lastSavedAt))}
          </span>
        ) : (
          <span>{isDirty ? EDITOR_UI.STATUS_NOT_SAVED_YET : EDITOR_UI.STATUS_NEW_POST}</span>
        )}
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span>{EDITOR_UI.WORD_COUNT_LABEL(wordCount.toLocaleString())}</span>
        <span>{EDITOR_UI.CHAR_COUNT_LABEL(characterCount.toLocaleString())}</span>
        {readingTimeMinutes > 0 && <span>{EDITOR_UI.READ_TIME_LABEL(readingTimeMinutes)}</span>}
      </div>
    </div>
  );
};

export default EditorStatusBar;
