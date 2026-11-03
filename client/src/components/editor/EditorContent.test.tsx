import React from "react";

import { TEST_IDS } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_EDITOR_FORM } from "@constants/editor";
import { EDITOR_UI } from "@constants/messages";

function createChainMock(): Record<string, ReturnType<typeof vi.fn>> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    focus: vi.fn(),
    run: vi.fn(),
  };
  const methods = [
    "toggleBold",
    "toggleItalic",
    "toggleUnderline",
    "toggleHeading",
    "toggleBulletList",
    "toggleOrderedList",
    "toggleBlockquote",
    "toggleCode",
    "toggleCodeBlock",
    "setTextAlign",
    "extendMarkRange",
    "unsetLink",
    "setLink",
    "setImage",
    "setHorizontalRule",
    "undo",
    "redo",
  ];
  for (const method of methods) {
    chain[method] = vi.fn();
  }
  for (const method of methods) {
    chain[method].mockReturnValue(chain);
  }
  chain.focus.mockReturnValue(chain);
  return chain;
}

const editorMock = {
  chain: vi.fn(() => createChainMock()),
  isActive: vi.fn(() => false),
  getAttributes: vi.fn(() => ({ href: "" })),
  getHTML: vi.fn(() => "<p>Hello</p>"),
  commands: { setContent: vi.fn() },
};

vi.mock("@tiptap/react", () => ({
  useEditor: (options: { onUpdate?: (args: { editor: typeof editorMock }) => void }) => {
    if (options?.onUpdate) {
      options.onUpdate({ editor: editorMock });
    }
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
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    const loaderStr = String(loader);
    if (loaderStr.includes("EditorPreview")) {
      const PreviewStub = () => <div data-testid="preview-stub">preview</div>;
      return PreviewStub;
    }
    const AiStub = () => <div data-testid="ai-toolkit-stub" />;
    return AiStub;
  },
}));

vi.mock("@hooks/useToast", () => ({
  useToast: () => ({
    loading: vi.fn(() => "toast-id"),
    removeToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@utils/apiClient", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@utils/apiClient")>();
  return {
    ...mod,
    apiClient: {
      ...mod.apiClient,
      uploadImage: vi.fn(),
    },
  };
});

import EditorContent from "./EditorContent";

describe("EditorContent", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    editorMock.getHTML.mockReturnValue("<p>Hello</p>");
  });

  const baseProps = {
    formData: { ...INITIAL_EDITOR_FORM, title: "My post", content_markdown: "Hello" },
    activeTab: "edit" as const,
    onTitleChange: vi.fn(),
    onContentChange: vi.fn(),
    tagList: [] as string[],
  };

  it("renders title input and tiptap surface in edit mode", () => {
    render(<EditorContent {...baseProps} />);
    expect(screen.getByTestId(TEST_IDS.EDITOR_TITLE)).toHaveValue("My post");
    expect(screen.getByTestId(TEST_IDS.EDITOR_CONTENT)).toBeInTheDocument();
    expect(screen.getByTestId("tiptap-surface")).toBeInTheDocument();
  });

  it("forwards title changes", async () => {
    const onTitleChange = vi.fn();
    render(<EditorContent {...baseProps} onTitleChange={onTitleChange} />);
    await userEvent.type(screen.getByTestId(TEST_IDS.EDITOR_TITLE), "!");
    expect(onTitleChange).toHaveBeenCalled();
  });

  it("shows preview stub when preview tab is active", () => {
    render(<EditorContent {...baseProps} activeTab="preview" />);
    expect(screen.getAllByTestId("preview-stub").length).toBeGreaterThan(0);
  });

  it("toolbar bold invokes editor chain", async () => {
    render(<EditorContent {...baseProps} />);
    const boldBtn = screen.getByTitle(EDITOR_UI.TOOLBAR_BOLD);
    await userEvent.click(boldBtn);
    expect(editorMock.chain).toHaveBeenCalled();
  });

  it("toolbar italic and lists invoke editor chain", async () => {
    render(<EditorContent {...baseProps} />);
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_ITALIC));
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_BULLET_LIST));
    expect(editorMock.chain.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("syncs content from editor updates", () => {
    const onContentChange = vi.fn();
    render(<EditorContent {...baseProps} onContentChange={onContentChange} />);
    expect(onContentChange).toHaveBeenCalled();
  });

  it("adds link via prompt and editor chain", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValueOnce("https://example.com");
    render(<EditorContent {...baseProps} />);
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_LINK));
    expect(promptSpy).toHaveBeenCalled();
    expect(editorMock.chain).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("inserts image when prompt returns url", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValueOnce("https://cdn.test/img.png");
    render(<EditorContent {...baseProps} />);
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_IMAGE));
    expect(promptSpy).toHaveBeenCalled();
    expect(editorMock.chain).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("invokes heading, code block, undo, and horizontal rule toolbar actions", async () => {
    render(<EditorContent {...baseProps} />);
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_HEADING_1));
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_CODE_BLOCK));
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_HORIZONTAL_RULE));
    await userEvent.click(screen.getByTitle(EDITOR_UI.TOOLBAR_UNDO));
    expect(editorMock.chain.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("hydrates editor when markdown content arrives on edit tab", () => {
    editorMock.getHTML.mockReturnValue("<p></p>");
    const { rerender } = render(
      <EditorContent {...baseProps} formData={{ ...baseProps.formData, content_markdown: "" }} />,
    );
    rerender(
      <EditorContent
        {...baseProps}
        formData={{ ...baseProps.formData, content_markdown: "# Updated\n\nBody copy" }}
      />,
    );
    expect(editorMock.commands.setContent).toHaveBeenCalled();
  });
});
