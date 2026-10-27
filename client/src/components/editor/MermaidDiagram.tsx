"use client";

import { useEffect, useId, useState } from "react";

import { THEME_VALUES } from "@constants";
import { useTheme } from "@contexts/ThemeContext";
import type { MermaidDiagramProps } from "@types";

import { MERMAID_CONFIG, MERMAID_UI } from "@constants/mermaid";
import { EDITOR_UI } from "@constants/messages";

function themeToMermaidTheme(
  theme: string,
): (typeof MERMAID_CONFIG)["THEME_LIGHT"] | (typeof MERMAID_CONFIG)["THEME_DARK"] {
  return theme === THEME_VALUES.DARK ? MERMAID_CONFIG.THEME_DARK : MERMAID_CONFIG.THEME_LIGHT;
}

/**
 * Client-only Mermaid renderer (DEV.to ```mermaid fence parity).
 */
export default function MermaidDiagram({ source, className = "" }: MermaidDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const mermaidTheme = themeToMermaidTheme(theme);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const chart = source.trim();
    if (!chart) {
      setSvg("");
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: MERMAID_CONFIG.START_ON_LOAD,
          securityLevel: MERMAID_CONFIG.SECURITY_LEVEL,
          theme: mermaidTheme,
        });
        const renderId = `${MERMAID_CONFIG.RENDER_ID_PREFIX}${reactId}-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(renderId, chart);
        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setSvg("");
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [source, reactId, mermaidTheme]);

  if (loading && !svg) {
    return (
      <div className={`${MERMAID_UI.FRAME_CLASS} ${className}`.trim()} aria-busy="true">
        <p className="text-sm text-muted-foreground">{EDITOR_UI.MERMAID_RENDER_LOADING}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${MERMAID_UI.ERROR_CLASS} ${className}`.trim()} role="alert">
        <p>{EDITOR_UI.MERMAID_RENDER_ERROR}</p>
        <pre className={MERMAID_UI.SOURCE_PRE_CLASS}>{source.trim()}</pre>
      </div>
    );
  }

  if (!svg) {
    return null;
  }

  return (
    <div
      className={`${MERMAID_UI.FRAME_CLASS} ${className}`.trim()}
      role="img"
      aria-label={EDITOR_UI.MERMAID_DIAGRAM_ARIA}
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
