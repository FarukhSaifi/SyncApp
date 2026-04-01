"use client";
import React, { useState, useRef, useEffect } from "react";
import { 
  FiChevronDown, 
  FiMessageSquare, 
  FiPlus, 
  FiSearch, 
  FiEdit2, 
  FiTrendingUp, 
  FiCheckSquare,
  FiLoader
} from "react-icons/fi";
import { useToast } from "@hooks/useToast";
import { type Editor } from "@tiptap/react";
import { apiClient } from "@utils/apiClient";

interface AIToolkitDropdownProps {
  editor?: Editor | null;
  onAction?: (action: string) => void;
}

export const AIToolkitDropdown = ({ editor, onAction }: AIToolkitDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleTrigger = async (action: string, label: string) => {
    setIsOpen(false);

    if (onAction) {
      onAction(action);
      return;
    }

    if (!editor) {
      toast.error("Editor not initialized");
      return;
    }

    let text = "";
    let isSelection = true;
    const { from, to } = editor.state.selection;
    
    // Check if there is a selection
    if (from !== to) {
      text = editor.state.doc.textBetween(from, to, " ");
    } else {
      // Find the block text surrounding the cursor
      isSelection = false;
      const $pos = editor.state.selection.$from;
      text = $pos.parent.textContent;
    }

    if (!text || text.trim() === "") {
      toast.validationError("Please write something or highlight text first.");
      return;
    }

    setLoadingAction(action);
    try {
      const response = await apiClient.aiEdit(label, text);
      if (response?.success && response.data?.result) {
        toast.apiSuccess("AI Edit Complete");
        const result = response.data.result;

        if (isSelection) {
          editor.chain().focus().insertContent(result).run();
        } else {
          // Replace the current block content
          const $pos = editor.state.selection.$from;
          const start = $pos.before();
          const end = $pos.after();
          editor.chain().focus().deleteRange({ from: start, to: end }).insertContent(result).run();
        }
      } else {
        toast.apiError("Unknown error occurred");
      }
    } catch (error) {
       toast.apiError((error as Error).message || "Failed to perform AI edit");
    } finally {
      setLoadingAction(null);
    }
  };

  const isAnyLoading = loadingAction !== null;

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isAnyLoading}
        className={`flex items-center gap-2 transition-colors py-1.5 px-3 rounded-md text-xs font-semibold shadow-sm ${
          isAnyLoading 
            ? "bg-primary/20 text-primary cursor-wait" 
            : "bg-[#2a2a2e] text-gray-200 hover:bg-[#3f3f46]"
        }`}
      >
        {isAnyLoading ? (
           <><FiLoader className="h-3.5 w-3.5 animate-spin" /><span>Processing...</span></>
        ) : (
           <><span>AI Toolkit examples</span><FiChevronDown className="h-3.5 w-3.5" /></>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-[#f8f9fa] dark:bg-[#1e1e22] shadow-lg border border-border overflow-hidden z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <ul className="flex flex-col text-[13px] font-medium text-gray-700 dark:text-gray-300">
            <li>
              <button disabled={isAnyLoading} onClick={() => handleTrigger("comment", "Add AI comment")} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <FiMessageSquare className="h-4 w-4 text-gray-500" />
                Add AI comment
              </button>
            </li>
            <li>
              <button 
                disabled={isAnyLoading}
                onClick={() => handleTrigger("paragraph", "Add new paragraph")} 
                className="w-full flex items-center gap-3 px-3 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors text-black dark:text-white disabled:opacity-50"
              >
                <FiPlus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                Add new paragraph
              </button>
            </li>
            <li>
              <button disabled={isAnyLoading} onClick={() => handleTrigger("proofread", "Proofread")} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <FiSearch className="h-4 w-4 text-gray-500" />
                Proofread
              </button>
            </li>
            <li>
              <button disabled={isAnyLoading} onClick={() => handleTrigger("adjust", "Adjust text selection")} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <FiEdit2 className="h-4 w-4 text-gray-500" />
                Adjust text selection
              </button>
            </li>
            <li>
              <button disabled={isAnyLoading} onClick={() => handleTrigger("component", "Add custom component")} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <FiTrendingUp className="h-4 w-4 text-gray-500" />
                Add custom component
              </button>
            </li>
            <li>
              <button disabled={isAnyLoading} onClick={() => handleTrigger("justify", "Justify edit")} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <FiCheckSquare className="h-4 w-4 text-gray-500" />
                Justify edit
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
