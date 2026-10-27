"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { isMermaidSource } from "@utils/mermaidDetect";

import { MERMAID_UI } from "@constants/mermaid";

import MermaidDiagram from "./MermaidDiagram";

/**
 * TipTap code-block node view — renders Mermaid diagrams live (DEV.to parity)
 * while keeping the editable source below for authoring.
 */
export default function MermaidCodeBlockNodeView({ node }: NodeViewProps) {
  const language = typeof node.attrs.language === "string" ? node.attrs.language : "";
  const source = node.textContent || "";
  const showDiagram = isMermaidSource(language, source);

  return (
    <NodeViewWrapper
      as="div"
      className={showDiagram ? MERMAID_UI.TIPTAP_WRAP_CLASS : undefined}
      data-language={language || undefined}
    >
      {showDiagram && source.trim() ? <MermaidDiagram source={source} /> : null}
      <pre className={showDiagram ? MERMAID_UI.TIPTAP_PRE_CLASS : undefined} spellCheck={false}>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}
