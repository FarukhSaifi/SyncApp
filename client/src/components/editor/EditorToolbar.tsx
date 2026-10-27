"use client";

import { TEST_IDS } from "@constants";
import type { EditorToolbarProps } from "@types";
import { FiArrowLeft, FiEdit2, FiEye, FiSave, FiSend, FiSettings } from "react-icons/fi";

import { BUTTON_SIZES, BUTTON_VARIANTS } from "@constants/designTokens";
import { BUTTON_LABELS, EDITOR_UI, SYNC_LABEL } from "@constants/messages";

import Button from "@components/common/Button";

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
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
          aria-label={BUTTON_LABELS["BACK_TO_DASHBOARD_ARIA"]}
        >
          <FiArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{BUTTON_LABELS["BACK_TO_DASHBOARD"]}</span>
        </button>

        <div className="hidden sm:block h-5 w-px bg-border" />

        <span className="hidden sm:inline text-sm font-medium text-foreground">
          {isEditing ? SYNC_LABEL["EDIT_POST"] : SYNC_LABEL["NEW_POST"]}
        </span>
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => {
            if (activeTab !== "edit") {
              onTogglePreview();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "edit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FiEdit2 className="h-3.5 w-3.5" />
          {SYNC_LABEL["TAB_EDIT"]}
        </button>
        <button
          onClick={() => {
            if (activeTab !== "preview") {
              onTogglePreview();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === "preview"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FiEye className="h-3.5 w-3.5" />
          {SYNC_LABEL["TAB_PREVIEW"]}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {wordCount > 0 ? (
          <span className="hidden md:inline text-xs text-muted-foreground tabular-nums">
            {EDITOR_UI["WORD_COUNT_LABEL"](wordCount.toLocaleString())}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onToggleLeftSidebar}
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={EDITOR_UI["TOGGLE_POST_SETTINGS"]}
          title={EDITOR_UI["POST_SETTINGS_DRAWER_TITLE"]}
        >
          <FiSettings className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleRightSidebar}
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={EDITOR_UI["TOGGLE_PUBLISH_AI"]}
          title={EDITOR_UI["PUBLISH_AI_DRAWER_TITLE"]}
        >
          <FiSend className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {isDirty ? <span className="unsaved-dot" title={EDITOR_UI["UNSAVED_CHANGES_TITLE"]} /> : null}
          <Button
            variant={BUTTON_VARIANTS.PRIMARY}
            size={BUTTON_SIZES.SM}
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-1.5"
            data-testid={TEST_IDS.EDITOR_SAVE}
          >
            <FiSave className="h-3.5 w-3.5" />
            {loading ? SYNC_LABEL["SAVING"] : SYNC_LABEL["SAVE_POST"]}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
