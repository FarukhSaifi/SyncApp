"use client";
import React from "react";

interface EditorStatusBarProps {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  lastSavedAt: Date | null;
  isDirty: boolean;
}

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
            {isDirty ? "Unsaved changes" : `Saved at ${formatTime(lastSavedAt)}`}
          </span>
        ) : (
          <span>{isDirty ? "Not saved yet" : "New post"}</span>
        )}
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span>{wordCount.toLocaleString()} words</span>
        <span>{characterCount.toLocaleString()} chars</span>
        {readingTimeMinutes > 0 && <span>{readingTimeMinutes} min read</span>}
      </div>
    </div>
  );
};

export default EditorStatusBar;
