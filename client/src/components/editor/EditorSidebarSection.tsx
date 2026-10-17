"use client";

import { useState } from "react";

import type { EditorSidebarSectionProps } from "@types";
import { FiChevronDown } from "react-icons/fi";

/** Collapsible section shared by left/right editor sidebars. */
export default function EditorSidebarSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: EditorSidebarSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-header"
        onClick={() => {
          setOpen(!open);
        }}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <FiChevronDown className="sidebar-section-chevron h-4 w-4" />
      </button>
      {open ? <div className="sidebar-section-body">{children}</div> : null}
    </div>
  );
}
