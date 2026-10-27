"use client";

import React, { useEffect, useId, useRef, useState } from "react";

import { THEME_VALUES } from "@constants";
import { useTheme } from "@contexts/ThemeContext";
import type {
  EditorPreviewProps,
  HtmlPreviewWithMermaidProps,
  MarkdownImageProps,
  PreviewCoverImageProps,
} from "@types";
import { isLikelyHtml, toStorageMarkdown } from "@utils/contentUtils";
import { readCoverPreviewCache } from "@utils/coverPreviewCache";
import { logError } from "@utils/logger";
import { isMermaidSource } from "@utils/mermaidDetect";
import ReactMarkdown, { type ExtraProps } from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-async-light";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

import { EDITOR_PREVIEW_CODE, EDITOR_PREVIEW_COVER, EDITOR_PREVIEW_IMAGE } from "@constants/editor";
import { MERMAID_CONFIG, MERMAID_UI } from "@constants/mermaid";
import { EDITOR_UI, SYNC_LABEL } from "@constants/messages";

import LazyImage from "@components/common/LazyImage";

import MermaidDiagram from "./MermaidDiagram";

/** Markdown/HTML image rendered via LazyImage in the preview tab. */
const MarkdownImage = ({ src, alt }: MarkdownImageProps) => {
  if (!src) {
    return null;
  }
  return (
    <LazyImage
      src={src}
      alt={alt || ""}
      width={EDITOR_PREVIEW_IMAGE.WIDTH}
      height={EDITOR_PREVIEW_IMAGE.HEIGHT}
      className={EDITOR_PREVIEW_IMAGE.CLASS}
      containerClassName={EDITOR_PREVIEW_IMAGE.CONTAINER_CLASS}
      skeletonClassName={EDITOR_PREVIEW_IMAGE.SKELETON_CLASS}
    />
  );
};

/** Featured cover block with optional base64 fallback when the remote URL fails. */
function PreviewCoverImage({ coverImage }: PreviewCoverImageProps) {
  const [imageError, setImageError] = useState(false);
  const [cachedBase64, setCachedBase64] = useState<string | null>(null);

  useEffect(() => {
    setImageError(false);
    setCachedBase64(coverImage ? readCoverPreviewCache(coverImage) : null);
  }, [coverImage]);

  const displaySrc = imageError && cachedBase64 ? cachedBase64 : coverImage;
  if (!displaySrc) {
    return null;
  }

  return (
    <div className={EDITOR_PREVIEW_COVER.FRAME_CLASS}>
      <LazyImage
        src={displaySrc}
        alt={imageError && cachedBase64 ? EDITOR_UI.COVER_PREVIEW_CACHED_ALT : EDITOR_UI.COVER_PREVIEW_ALT}
        viewportLazy={false}
        className={EDITOR_PREVIEW_COVER.IMAGE_CLASS}
        containerClassName={EDITOR_PREVIEW_COVER.CONTAINER_CLASS}
        onImageError={() => {
          setImageError(true);
        }}
      />
    </div>
  );
}

/**
 * TipTap preview often arrives as HTML (`language-mermaid` code fences).
 * Promote those to `.mermaid` nodes and run Mermaid (DEV.to parity).
 */
function HtmlPreviewWithMermaid({ html }: HtmlPreviewWithMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runId = useId().replace(/:/g, "");
  const { theme } = useTheme();
  const mermaidTheme = theme === THEME_VALUES.DARK ? MERMAID_CONFIG.THEME_DARK : MERMAID_CONFIG.THEME_LIGHT;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) {
      return;
    }

    let cancelled = false;

    const enhance = async () => {
      const blocks = root.querySelectorAll("pre code, pre");
      const seen = new Set<Element>();
      blocks.forEach((el, index) => {
        if (seen.has(el)) {
          return;
        }
        const codeEl = el.tagName === "CODE" ? el : el.querySelector("code") || el;
        const pre = el.tagName === "PRE" ? el : el.parentElement;
        if (!pre || pre.tagName !== "PRE" || seen.has(pre)) {
          return;
        }
        const className = `${codeEl.getAttribute("class") || ""} ${pre.getAttribute("class") || ""}`;
        const langMatch = EDITOR_PREVIEW_CODE.LANGUAGE_CLASS_RE.exec(className);
        const source = codeEl.textContent || "";
        if (!isMermaidSource(langMatch?.[1], source)) {
          return;
        }
        seen.add(pre);
        seen.add(codeEl);
        const host = document.createElement("div");
        host.className = `mermaid ${MERMAID_UI.FRAME_CLASS}`;
        host.setAttribute("data-mermaid-id", `${MERMAID_CONFIG.RENDER_ID_PREFIX}html-${runId}-${index}`);
        host.textContent = source;
        pre.replaceWith(host);
      });

      const targets = root.querySelectorAll<HTMLElement>(".mermaid");
      if (!targets.length || cancelled) {
        return;
      }

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: MERMAID_CONFIG.START_ON_LOAD,
          securityLevel: MERMAID_CONFIG.SECURITY_LEVEL,
          theme: mermaidTheme,
        });
        await mermaid.run({ nodes: targets });
      } catch (error) {
        // Leave source text visible inside .mermaid hosts on failure.
        logError("EditorPreview Mermaid run failed", { error });
      }
    };

    void enhance();

    return () => {
      cancelled = true;
    };
  }, [html, runId, mermaidTheme]);

  return (
    <div
      // Remount on theme change so Mermaid hosts reset to source before re-run.
      key={mermaidTheme}
      ref={containerRef}
      className={EDITOR_PREVIEW_CODE.PROSE_CLASS}
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{
        __html: html || SYNC_LABEL.NO_CONTENT_YET,
      }}
    />
  );
}

/** Read-only post preview (title, cover, markdown/HTML body, tags). */
const EditorPreview = ({ title, coverImage, previewContent, tagList }: EditorPreviewProps) => {
  const trimmedCover = coverImage?.trim() ?? "";
  const asHtml = isLikelyHtml(previewContent);
  const markdownSource = asHtml ? toStorageMarkdown(previewContent) : previewContent;

  return (
    <div className={EDITOR_PREVIEW_CODE.ROOT_CLASS}>
      <h1 className={EDITOR_PREVIEW_CODE.TITLE_CLASS}>{title || SYNC_LABEL.UNTITLED_POST}</h1>

      {trimmedCover ? <PreviewCoverImage coverImage={trimmedCover} /> : null}

      {asHtml ? (
        <HtmlPreviewWithMermaid html={previewContent} />
      ) : (
        <ReactMarkdown
          components={{
            code({ className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & ExtraProps) {
              const match = EDITOR_PREVIEW_CODE.LANGUAGE_CLASS_RE.exec(className || "");
              const inline = !match;
              const codeText = String(children).replace(/\n$/, "");
              if (!inline && match) {
                if (isMermaidSource(match[1], codeText)) {
                  return <MermaidDiagram source={codeText} />;
                }
                return (
                  <div className={EDITOR_PREVIEW_CODE.WRAP_CLASS}>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={EDITOR_PREVIEW_CODE.CUSTOM_STYLE}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
                <code className={`${EDITOR_PREVIEW_CODE.INLINE_CLASS} ${className || ""}`} {...props}>
                  {children}
                </code>
              );
            },
            img({ src, alt }: React.ComponentPropsWithoutRef<"img"> & ExtraProps) {
              const imageSrc = typeof src === "string" ? src : undefined;
              return <MarkdownImage src={imageSrc} alt={alt} />;
            },
          }}
        >
          {markdownSource || SYNC_LABEL.NO_CONTENT_YET}
        </ReactMarkdown>
      )}

      {tagList.length > 0 ? (
        <div className={EDITOR_PREVIEW_CODE.TAG_WRAP_CLASS}>
          {tagList.map((tag) => (
            <span key={tag} className={EDITOR_PREVIEW_CODE.TAG_CLASS}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default EditorPreview;
