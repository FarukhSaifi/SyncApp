import React from "react";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SYNC_LABEL } from "@constants/messages";

vi.mock("@contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("react-markdown", () => ({
  default: ({
    children,
    components,
  }: {
    children: string;
    components?: {
      code?: (props: React.ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => React.ReactNode;
    };
  }) => {
    const fenced = /```(\w+)\n([\s\S]*?)```/.exec(children);
    if (fenced && components?.code) {
      return (
        <article data-testid="markdown">
          {components.code({
            className: `language-${fenced[1]}`,
            children: fenced[2],
            inline: false,
          })}
        </article>
      );
    }
    return <article data-testid="markdown">{children}</article>;
  },
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn(async () => undefined),
  },
}));

vi.mock("react-syntax-highlighter/dist/esm/prism-async-light", () => ({
  default: ({ children }: { children: string }) => <pre data-testid="code-block">{children}</pre>,
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism/one-dark", () => ({ default: {} }));

vi.mock("@components/common/LazyImage", () => ({
  default: ({ alt }: { alt?: string }) => <img data-testid="lazy-image" alt={alt || ""} />,
}));

vi.mock("./MermaidDiagram", () => ({
  default: () => <div data-testid="mermaid">diagram</div>,
}));

import EditorPreview from "./EditorPreview";

describe("EditorPreview", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders untitled fallback and markdown body", () => {
    render(<EditorPreview title="" previewContent="# Hello preview" tagList={[]} />);
    expect(screen.getByText(SYNC_LABEL.UNTITLED_POST)).toBeInTheDocument();
    expect(screen.getByTestId("markdown")).toHaveTextContent("# Hello preview");
  });

  it("renders HTML preview branch when content looks like HTML", () => {
    render(
      <EditorPreview
        title="HTML post"
        previewContent="<p><strong>Bold</strong> preview</p>"
        tagList={[]}
      />,
    );
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });

  it("renders title, tags, and cover image block", () => {
    render(
      <EditorPreview
        title="My post"
        previewContent="Plain text"
        tagList={["react", "seo"]}
        coverImage="https://cdn.test/cover.png"
      />,
    );
    expect(screen.getByRole("heading", { name: "My post" })).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByTestId("lazy-image")).toBeInTheDocument();
  });

  it("shows empty content placeholder for markdown", () => {
    render(<EditorPreview title="Draft" previewContent="" tagList={[]} />);
    expect(screen.getByText(SYNC_LABEL.NO_CONTENT_YET)).toBeInTheDocument();
  });

  it("renders mermaid fenced block in markdown preview", () => {
    render(
      <EditorPreview
        title="Diagram"
        previewContent={"```mermaid\nflowchart TD\n  A-->B\n```"}
        tagList={[]}
      />,
    );
    expect(screen.getByTestId("mermaid")).toBeInTheDocument();
  });

  it("renders syntax highlighter for non-mermaid code fences", () => {
    render(
      <EditorPreview
        title="Code"
        previewContent={"```typescript\nconst x = 1\n```"}
        tagList={[]}
      />,
    );
    expect(screen.getByTestId("code-block")).toHaveTextContent("const x = 1");
  });

  it("enhances mermaid blocks in HTML preview", async () => {
    render(
      <EditorPreview
        title="Html mermaid"
        previewContent={'<pre><code class="language-mermaid">flowchart TD\n  A--&gt;B</code></pre>'}
        tagList={[]}
      />,
    );
    await waitFor(() => {
      expect(document.querySelector(".mermaid")).toBeInTheDocument();
    });
  });
});
