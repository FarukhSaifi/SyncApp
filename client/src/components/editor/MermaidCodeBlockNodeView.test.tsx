import React from "react";

import { cleanup, render, screen } from "@testing-library/react";
import type { NodeViewProps } from "@tiptap/react";
import { afterEach, describe, expect, it, vi } from "vitest";


import MermaidCodeBlockNodeView from "./MermaidCodeBlockNodeView";

vi.mock("./MermaidDiagram", () => ({
  default: ({ source }: { source: string }) => <div data-testid="mermaid-diagram">{source.trim()}</div>,
}));

vi.mock("@tiptap/react", () => ({
  NodeViewWrapper: ({
    children,
    className,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    "data-language"?: string;
  }) => (
    <div data-testid="node-view-wrapper" className={className} data-language={rest["data-language"]}>
      {children}
    </div>
  ),
  NodeViewContent: () => <span data-testid="node-view-content" />,
}));

function makeProps(partial: Partial<NodeViewProps>): NodeViewProps {
  return {
    node: {
      attrs: { language: "mermaid" },
      textContent: "flowchart TD\n  A-->B",
    },
    ...partial,
  } as NodeViewProps;
}

describe("MermaidCodeBlockNodeView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders live diagram and source pre for mermaid blocks", () => {
    render(<MermaidCodeBlockNodeView {...makeProps({})} />);
    expect(screen.getByTestId("mermaid-diagram")).toHaveTextContent("flowchart TD");
    expect(screen.getByTestId("node-view-wrapper")).toHaveAttribute("data-language", "mermaid");
    expect(screen.getByTestId("node-view-content")).toBeInTheDocument();
  });

  it("omits diagram for non-mermaid language", () => {
    render(
      <MermaidCodeBlockNodeView
        {...makeProps({
          node: {
            attrs: { language: "typescript" },
            textContent: "const x = 1",
          } as unknown as NodeViewProps["node"],
        })}
      />,
    );
    expect(screen.queryByTestId("mermaid-diagram")).not.toBeInTheDocument();
  });

  it("omits diagram when mermaid source is whitespace only", () => {
    render(
      <MermaidCodeBlockNodeView
        {...makeProps({
          node: {
            attrs: { language: "mermaid" },
            textContent: "   ",
          } as unknown as NodeViewProps["node"],
        })}
      />,
    );
    expect(screen.queryByTestId("mermaid-diagram")).not.toBeInTheDocument();
  });
});
