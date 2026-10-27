import { MERMAID_LANG, MERMAID_SOURCE_START } from "@constants/mermaid";

/** True when a fenced block should render as Mermaid (explicit lang or recognizable source). */
export function isMermaidSource(language: string | null | undefined, source: string): boolean {
  const lang = (language || "").trim().toLowerCase();
  if (lang === MERMAID_LANG) {
    return true;
  }
  const firstLine = source.trim().split("\n")[0]?.trim() || "";
  return MERMAID_SOURCE_START.test(firstLine);
}
