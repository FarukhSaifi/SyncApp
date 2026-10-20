"use client";
import React, { useCallback, useEffect } from "react";

import { useToast } from "@hooks/useToast";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent as TipTapEditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { EditorContentProps } from "@types";
import { apiClient } from "@utils/apiClient";
import { toEditorHtml, toStorageMarkdown } from "@utils/contentUtils";
import editorLowlight from "@utils/editorLowlight";
import dynamic from "next/dynamic";
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

import {
  EDITOR_UI,
  ERROR_MESSAGES,
  INFO_MESSAGES,
  SUCCESS_MESSAGES,
  TOAST_TITLES,
} from "@constants/messages";

import { EditorPreviewSkeleton } from "./EditorSkeletons";

const LazyAIToolkitDropdown = dynamic(() => import("./AIToolkitDropdown").then((m) => m.AIToolkitDropdown), {
  ssr: false,
});

const EditorPreview = dynamic(() => import("./EditorPreview"), {
  ssr: false,
  loading: () => <EditorPreviewSkeleton />,
});

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
    const url = window.prompt(EDITOR_UI.PROMPT_IMAGE_URL);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt(EDITOR_UI.PROMPT_LINK_URL, previousUrl);
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
        <LazyAIToolkitDropdown editor={editor} />
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title={EDITOR_UI.TOOLBAR_HEADING_1}
        >
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title={EDITOR_UI.TOOLBAR_HEADING_2}
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title={EDITOR_UI.TOOLBAR_HEADING_3}
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
          title={EDITOR_UI.TOOLBAR_NORMAL_TEXT}
        >
          <FiType className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title={EDITOR_UI.TOOLBAR_BOLD}
        >
          <FiBold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title={EDITOR_UI.TOOLBAR_ITALIC}
        >
          <FiItalic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title={EDITOR_UI.TOOLBAR_UNDERLINE}
        >
          <FiUnderline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title={EDITOR_UI.TOOLBAR_STRIKETHROUGH}
        >
          <FiMinus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title={EDITOR_UI.TOOLBAR_INLINE_CODE}
        >
          <FiCode className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title={EDITOR_UI.TOOLBAR_BULLET_LIST}
        >
          <FiList className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title={EDITOR_UI.TOOLBAR_ORDERED_LIST}
        >
          <span className="text-xs font-bold">1.</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title={EDITOR_UI.TOOLBAR_BLOCKQUOTE}
        >
          <span className="text-sm font-bold">&quot;</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title={EDITOR_UI.TOOLBAR_CODE_BLOCK}
        >
          <span className="text-xs font-mono">{"</>"}</span>
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title={EDITOR_UI.TOOLBAR_ALIGN_LEFT}
        >
          <FiAlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title={EDITOR_UI.TOOLBAR_ALIGN_CENTER}
        >
          <FiAlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title={EDITOR_UI.TOOLBAR_ALIGN_RIGHT}
        >
          <FiAlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} title={EDITOR_UI.TOOLBAR_LINK}>
          <FiLink className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title={EDITOR_UI.TOOLBAR_IMAGE}>
          <FiImage className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="tiptap-toolbar-sep" />

      <div className="tiptap-toolbar-group">
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title={EDITOR_UI.TOOLBAR_HORIZONTAL_RULE}
        >
          <span className="text-xs">—</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title={EDITOR_UI.TOOLBAR_UNDO}>
          <span className="text-xs">↩</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title={EDITOR_UI.TOOLBAR_REDO}>
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
    link: false, // registered below with custom openOnClick/HTMLAttributes
    underline: false, // registered below as standalone extension
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
    placeholder: EDITOR_UI.TIPTAP_PLACEHOLDER,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  CodeBlockLowlight.configure({
    lowlight: editorLowlight,
  }),
];

const EditorContent = ({ formData, activeTab, onTitleChange, onContentChange, tagList }: EditorContentProps) => {
  const toast = useToast();
  const editor = useEditor({
    extensions,
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;

            const toastId = toast.loading(TOAST_TITLES.UPLOADING_IMAGE, INFO_MESSAGES.UPLOADING_IMAGE);
            apiClient
              .uploadImage(file)
              .then((res) => {
                if (res.success && res.data?.url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: res.data.url });
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                  toast.removeToast(toastId);
                  toast.success(TOAST_TITLES.IMAGE_UPLOADED, SUCCESS_MESSAGES.IMAGE_UPLOADED);
                }
              })
              .catch((err) => {
                toast.removeToast(toastId);
                toast.error(TOAST_TITLES.UPLOAD_FAILED, err.message || ERROR_MESSAGES.FAILED_TO_UPLOAD_IMAGE);
              });
            return true; // handled
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image")) {
            event.preventDefault();

            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const toastId = toast.loading(TOAST_TITLES.UPLOADING_IMAGE, INFO_MESSAGES.UPLOADING_DROPPED_IMAGE);

            apiClient
              .uploadImage(file)
              .then((res) => {
                if (res.success && res.data?.url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: res.data.url });

                  // if dropped at a specific point
                  if (coordinates) {
                    const tr = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(tr);
                  } else {
                    const tr = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(tr);
                  }
                  toast.removeToast(toastId);
                  toast.success(TOAST_TITLES.IMAGE_UPLOADED, SUCCESS_MESSAGES.IMAGE_UPLOADED);
                }
              })
              .catch((err) => {
                toast.removeToast(toastId);
                toast.error(TOAST_TITLES.UPLOAD_FAILED, err.message || ERROR_MESSAGES.FAILED_TO_UPLOAD_DROPPED_IMAGE);
              });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      onContentChange(e.getHTML());
    },
  });

  // Sync formData → TipTap (AI draft, fetch post, tab switch).
  // Compare markdown, not HTML, so TipTap↔markdown round-trips do not reset the cursor.
  useEffect(() => {
    if (!editor || activeTab !== "edit") return;
    const incoming = formData.content_markdown || "";
    if (!incoming.trim()) return;

    const currentMd = toStorageMarkdown(editor.getHTML());
    const incomingMd = toStorageMarkdown(incoming);
    if (currentMd === incomingMd) return;

    const htmlContent = toEditorHtml(incomingMd);
    if (htmlContent && htmlContent !== "<p></p>") {
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
          placeholder={EDITOR_UI.TITLE_INPUT_PLACEHOLDER}
          className="editor-title-input"
          aria-label={EDITOR_UI.POST_TITLE_ARIA}
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
