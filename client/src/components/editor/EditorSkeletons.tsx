import Skeleton from "@components/common/Skeleton";

/** Skeleton for the editor main panel while TipTap or post data loads. */
export function EditorContentSkeleton() {
  return (
    <div className="editor-main bg-background p-4 sm:p-6 space-y-4" aria-busy="true" aria-label="Loading editor">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <div className="flex gap-1.5 border-b border-border pb-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={`toolbar-${i}`} className="h-8 w-8 rounded shrink-0" />
        ))}
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={`line-${i}`} className={`h-4 ${i % 3 === 2 ? "w-3/5" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the preview tab while markdown renderer loads. */
export function EditorPreviewSkeleton() {
  return (
    <div className="editor-preview p-4 sm:p-6 space-y-4" aria-busy="true" aria-label="Loading preview">
      <Skeleton className="h-9 w-3/4 max-w-lg" />
      <Skeleton className="w-full aspect-video max-h-64 rounded-lg" />
      <div className="space-y-2.5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={`preview-line-${i}`} className={`h-4 ${i === 5 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={`tag-${i}`} className="h-7 w-16 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for cover / featured image areas in sidebars and modals. */
export function ImagePreviewSkeleton({ className = "w-full aspect-video rounded-lg" }: { className?: string }) {
  return <Skeleton className={className} aria-hidden />;
}
