/**
 * Mermaid diagram rendering — editor preview + TipTap mermaid code blocks.
 * Matches DEV.to fenced ```mermaid behavior for authoring/preview.
 */
export const MERMAID_LANG = "mermaid" as const;

/** First-line keywords that identify Mermaid source when the fence language is missing. */
export const MERMAID_SOURCE_START =
  /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|C4Context|quadrantChart)\b/i;

export const MERMAID_CONFIG = Object.freeze({
  START_ON_LOAD: false,
  /** Restrict HTML in labels — diagrams are author-controlled but keep XSS surface low. */
  SECURITY_LEVEL: "strict" as const,
  THEME_LIGHT: "neutral" as const,
  THEME_DARK: "dark" as const,
  DARK_CLASS: "dark",
  RENDER_ID_PREFIX: "syncapp-mermaid-",
} as const);

export const MERMAID_UI = Object.freeze({
  FRAME_CLASS:
    "mermaid-diagram my-4 w-full overflow-x-auto rounded-lg border border-border bg-card p-3 sm:p-4 [&_svg]:mx-auto [&_svg]:max-w-full",
  ERROR_CLASS:
    "mermaid-diagram-error my-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive",
  SOURCE_PRE_CLASS: "mermaid-source mt-2 overflow-x-auto rounded-md bg-muted/60 p-3 text-xs text-muted-foreground",
  TIPTAP_WRAP_CLASS: "mermaid-tiptap-block my-4",
  TIPTAP_PRE_CLASS:
    "mermaid-tiptap-source overflow-x-auto rounded-b-lg border border-border border-t-0 bg-muted/40 p-3 text-sm",
} as const);
