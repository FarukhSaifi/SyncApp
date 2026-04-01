"use client";
import { FiArrowLeft, FiEdit2, FiEye, FiSave } from "react-icons/fi";

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
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={onToggleRightSidebar}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle publish panel"
          title="Publish & AI"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
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
