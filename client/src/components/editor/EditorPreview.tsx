"use client";
import React from "react";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-async-light";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

import { isLikelyHtml } from "@utils/contentUtils";
import { SYNC_LABEL } from "@constants/messages";

interface EditorPreviewProps {
  title: string;
  coverImage?: string;
  previewContent: string;
  tagList: string[];
}

const EditorPreview = ({ title, coverImage, previewContent, tagList }: EditorPreviewProps) => {
  return (
    <div className="editor-preview prose prose-base max-w-none">
      <h1 className="text-3xl font-bold mb-4">{title || SYNC_LABEL.UNTITLED_POST}</h1>
      
      {coverImage && (
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-auto max-h-64 object-cover rounded-lg mb-4"
        />
      )}
      
      {isLikelyHtml(previewContent) ? (
        <div
          className="prose prose-base max-w-none"
          dangerouslySetInnerHTML={{
            __html: previewContent || SYNC_LABEL.NO_CONTENT_YET,
          }}
        />
      ) : (
        <ReactMarkdown
          components={{
            code({ className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              const inline = !match;
              if (!inline && match) {
                return (
                  <div className="overflow-x-auto my-4">
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: 8,
                        fontSize: "0.875rem",
                        padding: "1rem",
                        margin: 0,
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                );
              }
              return (
                <code className={`font-mono text-sm bg-muted rounded px-1.5 py-0.5 ${className || ""}`} {...props}>
                  {children}
                </code>
              );
            },
            img({ src, alt }: any) {
              return <img src={src || ""} alt={alt || ""} className="w-full h-auto rounded-md" />;
            },
          }}
        >
          {previewContent || SYNC_LABEL.NO_CONTENT_YET}
        </ReactMarkdown>
      )}

      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-6">
          {tagList.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-primary/15 text-primary text-sm rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditorPreview;
