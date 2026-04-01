"use client";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent as TipTapEditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import React, { useCallback, useEffect } from "react";
import {
  FiAlignCenter,
  FiAlignLeft,
  FiAlignRight,
  FiBold,
  FiCode,
  FiImage,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
  FiType,
  FiUnderline,
} from "react-icons/fi";
import dynamic from "next/dynamic";

import { isLikelyMarkdown, markdownToHtml } from "@utils/contentUtils";
import type { EditorFormData } from "@hooks/useEditorState";
import { AIToolkitDropdown } from "./AIToolkitDropdown";

const lowlight = createLowlight(common);

const EditorPreview = dynamic(() => import("./EditorPreview"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted-foreground text-sm">Loading preview...</div>,
});

interface EditorContentProps {
  formData: EditorFormData;
  activeTab: "edit" | "preview";
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (html: string) => void;
  tagList: string[];
}

/** TipTap toolbar button */
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`tiptap-toolbar-btn ${isActive ? "is-active" : ""}`}
  >
    {children}
  </button>
);

/** TipTap toolbar */
const EditorToolbarBar = React.memo(({ editor }: { editor: ReturnType<typeof useEditor> | null }) => {
  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Link URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="tiptap-toolbar">
      <div className="tiptap-toolbar-group mr-2">
        <AIToolkitDropdown editor={editor} />
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
          title="Normal text"
        >
          <FiType className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <FiBold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <FiItalic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <FiUnderline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <FiMinus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Inline code"
        >
          <FiCode className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <FiList className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Ordered list"
        >
          <span className="text-xs font-bold">1.</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <span className="text-sm font-bold">&quot;</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code block"
        >
          <span className="text-xs font-mono">{"</>"}</span>
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <FiAlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <FiAlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <FiAlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title="Link">
          <FiLink className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Image">
          <FiImage className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <span className="text-xs">—</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
          <span className="text-xs">↩</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
          <span className="text-xs">↪</span>
        </ToolbarButton>
      </div>
    </div>
  );
});

EditorToolbarBar.displayName = "EditorToolbarBar";

const extensions = [
  StarterKit.configure({
    codeBlock: false, // replaced by CodeBlockLowlight
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: "tiptap-link" },
  }),
  Image.configure({
    HTMLAttributes: { class: "tiptap-image" },
  }),
  Placeholder.configure({
    placeholder: "Start writing your post…",
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
];

const EditorContent = ({ formData, activeTab, onTitleChange, onContentChange, tagList }: EditorContentProps) => {
  const editor = useEditor({
    extensions,
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
    onUpdate: ({ editor: e }) => {
      onContentChange(e.getHTML());
    },
  });

  // Sync formData → TipTap (AI draft, fetch post, tab switch)
  useEffect(() => {
    if (!editor || activeTab !== "edit") return;
    const currentContent = editor.getHTML();
    const newContent = formData.content_markdown || "";

    // If content is markdown, convert to HTML first
    let htmlContent = newContent;
    if (isLikelyMarkdown(newContent)) {
      htmlContent = markdownToHtml(newContent);
    }

    // Only update if content actually changed (avoids cursor jumping)
    if (currentContent !== htmlContent && htmlContent !== "<p></p>") {
      editor.commands.setContent(htmlContent, { emitUpdate: false });
    }
  }, [editor, formData.content_markdown, activeTab]);

  // Preview content source
  const previewContent = editor?.getHTML() || formData.content_markdown || "";

  return (
    <div className="editor-main bg-background">
      {/* Edit mode */}
      <div className={activeTab !== "edit" ? "hidden" : "flex flex-col flex-1"}>
        <input
          name="title"
          value={formData.title}
          onChange={onTitleChange}
          placeholder="Add title"
          className="editor-title-input"
          aria-label="Post title"
          autoFocus
        />
        <div className="tiptap-wrapper flex flex-col flex-1">
          <EditorToolbarBar editor={editor} />
          <TipTapEditorContent editor={editor} className="tiptap-content-area" />
        </div>
      </div>

      {/* Preview mode */}
      <div className={activeTab !== "preview" ? "hidden" : "flex-1 overflow-auto"}>
        {activeTab === "preview" && (
          <EditorPreview
            title={formData.title}
            coverImage={formData.cover_image}
            previewContent={previewContent}
            tagList={tagList}
          />
        )}
      </div>
    </div>
  );
};

export default EditorContent;
