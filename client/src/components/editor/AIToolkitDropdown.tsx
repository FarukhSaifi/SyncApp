"use client";

import { useEffect, useRef, useState } from "react";

import { useToast } from "@hooks/useToast";
import type { AIToolkitDropdownProps } from "@types";
import { apiClient } from "@utils/apiClient";
import {
  FiCheckSquare,
  FiChevronDown,
  FiEdit2,
  FiLoader,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiTrendingUp,
} from "react-icons/fi";

import { AI_TOOLKIT_ACTIONS, AI_TOOLKIT_UI } from "@constants/editor";
import { EDITOR_UI, ERROR_MESSAGES, INFO_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from "@constants/messages";

export const AIToolkitDropdown = ({ editor, onAction }: AIToolkitDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleTrigger = async (action: string, label: string) => {
    setIsOpen(false);

    if (onAction) {
      onAction(action);
      return;
    }

    if (!editor) {
      toast.error(ERROR_MESSAGES.EDITOR_NOT_INITIALIZED);
      return;
    }

    let text: string;
    let isSelection = true;
    const { from, to } = editor.state.selection;

    if (from !== to) {
      text = editor.state.doc.textBetween(from, to, " ");
    } else {
      isSelection = false;
      const $pos = editor.state.selection.$from;
      text = $pos.parent.textContent;
    }

    if (!text || text.trim() === "") {
      toast.validationError(VALIDATION_MESSAGES.EDITOR_CONTENT_OR_SELECTION_REQUIRED);
      return;
    }

    setLoadingAction(action);
    try {
      const response = await apiClient.aiEdit(label, text);
      if (response?.success && response.data?.result) {
        toast.apiSuccess(SUCCESS_MESSAGES.AI_EDIT_COMPLETE);
        const result = response.data.result;

        if (isSelection) {
          editor.chain().focus().insertContent(result).run();
        } else {
          const $pos = editor.state.selection.$from;
          const start = $pos.before();
          const end = $pos.after();
          editor.chain().focus().deleteRange({ from: start, to: end }).insertContent(result).run();
        }
      } else {
        toast.apiError(ERROR_MESSAGES.AI_EDIT_UNKNOWN_ERROR);
      }
    } catch (error) {
      toast.apiError((error as Error).message || ERROR_MESSAGES.FAILED_TO_PERFORM_AI_EDIT);
    } finally {
      setLoadingAction(null);
    }
  };

  const isAnyLoading = loadingAction !== null;

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        disabled={isAnyLoading}
        className={`${AI_TOOLKIT_UI.TRIGGER_BASE} ${
          isAnyLoading ? AI_TOOLKIT_UI.TRIGGER_LOADING : AI_TOOLKIT_UI.TRIGGER_IDLE
        }`}
      >
        {isAnyLoading ? (
          <>
            <FiLoader className={`${AI_TOOLKIT_UI.TRIGGER_ICON} animate-spin`} />
            <span>{INFO_MESSAGES.PROCESSING}</span>
          </>
        ) : (
          <>
            <span>{EDITOR_UI.AI_TOOLKIT_TRIGGER}</span>
            <FiChevronDown className={AI_TOOLKIT_UI.TRIGGER_ICON} />
          </>
        )}
      </button>

      {isOpen ? (
        <div className={AI_TOOLKIT_UI.MENU_PANEL}>
          <ul className={AI_TOOLKIT_UI.MENU_LIST}>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.COMMENT, EDITOR_UI.AI_TOOLKIT_ADD_COMMENT);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM}
              >
                <FiMessageSquare className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_ADD_COMMENT}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.PARAGRAPH, EDITOR_UI.AI_TOOLKIT_ADD_PARAGRAPH);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM_EMPHASIS}
              >
                <FiPlus className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_ADD_PARAGRAPH}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.PROOFREAD, EDITOR_UI.AI_TOOLKIT_PROOFREAD);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM}
              >
                <FiSearch className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_PROOFREAD}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.ADJUST, EDITOR_UI.AI_TOOLKIT_ADJUST_SELECTION);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM}
              >
                <FiEdit2 className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_ADJUST_SELECTION}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.COMPONENT, EDITOR_UI.AI_TOOLKIT_ADD_COMPONENT);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM}
              >
                <FiTrendingUp className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_ADD_COMPONENT}
              </button>
            </li>
            <li>
              <button
                type="button"
                disabled={isAnyLoading}
                onClick={() => {
                  void handleTrigger(AI_TOOLKIT_ACTIONS.JUSTIFY, EDITOR_UI.AI_TOOLKIT_JUSTIFY_EDIT);
                }}
                className={AI_TOOLKIT_UI.MENU_ITEM}
              >
                <FiCheckSquare className={AI_TOOLKIT_UI.MENU_ICON} />
                {EDITOR_UI.AI_TOOLKIT_JUSTIFY_EDIT}
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
};
