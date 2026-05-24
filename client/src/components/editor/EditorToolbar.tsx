"use client";
import { FiArrowLeft, FiEdit2, FiEye, FiSave, FiSend, FiSettings } from "react-icons/fi";

import Button from "@components/common/Button";

import { BUTTON_LABELS, SYNC_LABEL } from "@constants/messages";

interface EditorToolbarProps {
  isEditing: boolean;
  activeTab: "edit" | "preview";
  onTogglePreview: () => void;
  onSave: () => void;
  onBack: () => void;
  loading: boolean;
  isDirty: boolean;
  wordCount: number;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

const EditorToolbar = ({
  isEditing,
  activeTab,
  onTogglePreview,
  onSave,
  onBack,
  loading,
  isDirty,
  wordCount,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: EditorToolbarProps) => {
  return (
    <div className="editor-toolbar flex items-center justify-between px-4 py-2 border-b border-border bg-card">
      {/* Left: Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          aria-label="Back to dashboard"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{BUTTON_LABELS.BACK_TO_DASHBOARD}</span>
        </button>

        <div className="hidden sm:block h-5 w-px bg-border" />

        <span className="hidden sm:inline text-sm font-medium text-foreground">
          {isEditing ? SYNC_LABEL.EDIT_POST : SYNC_LABEL.NEW_POST}
        </span>
      </div>

      {/* Center: Edit/Preview toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => activeTab !== "edit" && onTogglePreview()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "edit"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FiEdit2 className="h-3.5 w-3.5" />
          {SYNC_LABEL.TAB_EDIT}
        </button>
        <button
          onClick={() => activeTab !== "preview" && onTogglePreview()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "preview"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FiEye className="h-3.5 w-3.5" />
          {SYNC_LABEL.TAB_PREVIEW}
        </button>
      </div>

      {/* Right: Word count + Save */}
      <div className="flex items-center gap-3">
        {wordCount > 0 && (
          <span className="hidden md:inline text-xs text-muted-foreground tabular-nums">
            {wordCount.toLocaleString()} words
          </span>
        )}

        {/* Mobile sidebar toggles */}
        <button
          onClick={onToggleLeftSidebar}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle post settings"
          title="Post settings"
        >
          <FiSettings className="h-4 w-4" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle publish panel"
          title="Publish & AI"
        >
          <FiSend className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {isDirty && <span className="unsaved-dot" title="Unsaved changes" />}
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <FiSave className="h-3.5 w-3.5" />
            {loading ? SYNC_LABEL.SAVING : SYNC_LABEL.SAVE_POST}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
