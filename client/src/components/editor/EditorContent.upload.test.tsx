import React from "react";

import { cleanup, render } from "@testing-library/react";
import { apiClient } from "@utils/apiClient";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_EDITOR_FORM } from "@constants/editor";
import { ERROR_MESSAGES, INFO_MESSAGES, SUCCESS_MESSAGES, TOAST_TITLES } from "@constants/messages";

type EditorOptions = {
  editorProps?: {
    handlePaste?: (view: unknown, event: unknown) => boolean;
    handleDrop?: (view: unknown, event: unknown, slice: unknown, moved: boolean) => boolean;
  };
  onUpdate?: (args: { editor: { getHTML: () => string } }) => void;
};

let capturedOptions: EditorOptions | undefined;

const editorMock = {
  chain: vi.fn(),
  isActive: vi.fn(() => false),
  getAttributes: vi.fn(() => ({ href: "" })),
  getHTML: vi.fn(() => "<p>Hello</p>"),
  commands: { setContent: vi.fn() },
};

vi.mock("@tiptap/react", () => ({
  useEditor: (options: EditorOptions) => {
    capturedOptions = options;
    options.onUpdate?.({ editor: editorMock });
    return editorMock;
  },
  EditorContent: () => <div data-testid="tiptap-surface">editor</div>,
  ReactNodeViewRenderer: vi.fn(),
}));

vi.mock("@tiptap/starter-kit", () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock("@tiptap/extension-underline", () => ({ default: {} }));
vi.mock("@tiptap/extension-link", () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock("@tiptap/extension-image", () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock("@tiptap/extension-placeholder", () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock("@tiptap/extension-text-align", () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock("@tiptap/extension-code-block-lowlight", () => ({
  default: { extend: vi.fn(() => ({ configure: vi.fn(() => ({})) })) },
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const PreviewStub = () => <div data-testid="preview-stub">preview</div>;
    return PreviewStub;
  },
}));

const toast = {
  loading: vi.fn(() => "toast-id"),
  removeToast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock("@hooks/useToast", () => ({
  useToast: () => toast,
}));

import EditorContent from "./EditorContent";

function buildView() {
  const replaceSelectionWith = vi.fn().mockReturnThis();
  const insert = vi.fn().mockReturnThis();
  const tr = { replaceSelectionWith, insert };
  const create = vi.fn(() => ({ type: "image" }));
  return {
    view: {
      state: {
        schema: { nodes: { image: { create } } },
        tr,
      },
      dispatch: vi.fn(),
      posAtCoords: vi.fn(() => ({ pos: 2 })),
    },
    tr,
    create,
  };
}

describe("EditorContent image paste and drop", () => {
  beforeEach(() => {
    capturedOptions = undefined;
    toast.loading.mockClear();
    toast.removeToast.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("uploads pasted image and inserts node on success", async () => {
    vi.spyOn(apiClient, "uploadImage").mockResolvedValue({
      success: true,
      data: { url: "https://cdn.test/pasted.png" },
    });

    render(
      <EditorContent
        formData={{ ...INITIAL_EDITOR_FORM, title: "T", content_markdown: "Hello" }}
        activeTab="edit"
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        tagList={[]}
      />,
    );

    const { view, tr } = buildView();
    const file = new File(["img"], "paste.png", { type: "image/png" });
    const event = {
      preventDefault: vi.fn(),
      clipboardData: {
        items: [{ type: "image/png", getAsFile: () => file }],
      },
    };

    const handled = capturedOptions?.editorProps?.handlePaste?.(view, event);
    expect(handled).toBe(true);
    await vi.waitFor(() => {
      expect(apiClient.uploadImage).toHaveBeenCalledWith(file);
      expect(tr.replaceSelectionWith).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(TOAST_TITLES.IMAGE_UPLOADED, SUCCESS_MESSAGES.IMAGE_UPLOADED);
    });
  });

  it("surfaces upload failure on pasted image", async () => {
    vi.spyOn(apiClient, "uploadImage").mockRejectedValue(new Error("upload failed"));

    render(
      <EditorContent
        formData={{ ...INITIAL_EDITOR_FORM, title: "T", content_markdown: "Hello" }}
        activeTab="edit"
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        tagList={[]}
      />,
    );

    const { view } = buildView();
    const file = new File(["img"], "paste.png", { type: "image/png" });
    const event = {
      preventDefault: vi.fn(),
      clipboardData: {
        items: [{ type: "image/png", getAsFile: () => file }],
      },
    };

    capturedOptions?.editorProps?.handlePaste?.(view, event);
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(TOAST_TITLES.UPLOAD_FAILED, "upload failed");
    });
  });

  it("uploads dropped image at cursor position", async () => {
    vi.spyOn(apiClient, "uploadImage").mockResolvedValue({
      success: true,
      data: { url: "https://cdn.test/dropped.png" },
    });

    render(
      <EditorContent
        formData={{ ...INITIAL_EDITOR_FORM, title: "T", content_markdown: "Hello" }}
        activeTab="edit"
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        tagList={[]}
      />,
    );

    const { view, tr } = buildView();
    const file = new File(["img"], "drop.png", { type: "image/png" });
    const event = {
      preventDefault: vi.fn(),
      clientX: 10,
      clientY: 20,
      dataTransfer: { files: [file] },
    };

    const handled = capturedOptions?.editorProps?.handleDrop?.(view, event, null, false);
    expect(handled).toBe(true);
    await vi.waitFor(() => {
      expect(tr.insert).toHaveBeenCalledWith(2, expect.anything());
      expect(toast.loading).toHaveBeenCalledWith(TOAST_TITLES.UPLOADING_IMAGE, INFO_MESSAGES.UPLOADING_DROPPED_IMAGE);
    });
  });

  it("returns false when paste has no image items", () => {
    render(
      <EditorContent
        formData={{ ...INITIAL_EDITOR_FORM, title: "T", content_markdown: "Hello" }}
        activeTab="edit"
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        tagList={[]}
      />,
    );

    const { view } = buildView();
    const handled = capturedOptions?.editorProps?.handlePaste?.(view, {
      clipboardData: { items: [{ type: "text/plain", getAsFile: () => null }] },
    });
    expect(handled).toBe(false);
  });

  it("shows generic upload error when rejection has no message", async () => {
    vi.spyOn(apiClient, "uploadImage").mockRejectedValue({});

    render(
      <EditorContent
        formData={{ ...INITIAL_EDITOR_FORM, title: "T", content_markdown: "Hello" }}
        activeTab="edit"
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        tagList={[]}
      />,
    );

    const { view } = buildView();
    const file = new File(["img"], "paste.png", { type: "image/png" });
    capturedOptions?.editorProps?.handlePaste?.(view, {
      preventDefault: vi.fn(),
      clipboardData: { items: [{ type: "image/png", getAsFile: () => file }] },
    });

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        TOAST_TITLES.UPLOAD_FAILED,
        ERROR_MESSAGES.FAILED_TO_UPLOAD_IMAGE,
      );
    });
  });
});
