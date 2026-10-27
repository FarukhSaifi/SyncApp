import type { ImagePreviewSkeletonProps } from "@types";

import { EDITOR_SKELETONS } from "@constants/editor";
import { EDITOR_UI } from "@constants/messages";

import Skeleton from "@components/common/Skeleton";

/** Skeleton for the editor main panel while TipTap or post data loads. */
export function EditorContentSkeleton() {
  return (
    <div
      className={EDITOR_SKELETONS.CONTENT_ROOT_CLASS}
      aria-busy="true"
      aria-label={EDITOR_UI.LOADING_EDITOR_ARIA}
    >
      <Skeleton className={EDITOR_SKELETONS.TITLE_CLASS} />
      <div className="flex gap-1.5 border-b border-border pb-2">
        {Array.from({ length: EDITOR_SKELETONS.TOOLBAR_COUNT }, (_, i) => (
          <Skeleton key={`toolbar-${i}`} className={EDITOR_SKELETONS.TOOLBAR_BTN_CLASS} />
        ))}
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: EDITOR_SKELETONS.BODY_LINE_COUNT }, (_, i) => (
          <Skeleton
            key={`line-${i}`}
            className={i % 3 === 2 ? EDITOR_SKELETONS.LINE_SHORT_CLASS : EDITOR_SKELETONS.LINE_FULL_CLASS}
          />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the preview tab while markdown renderer loads. */
export function EditorPreviewSkeleton() {
  return (
    <div
      className={EDITOR_SKELETONS.PREVIEW_ROOT_CLASS}
      aria-busy="true"
      aria-label={EDITOR_UI.LOADING_PREVIEW_ARIA}
    >
      <Skeleton className={EDITOR_SKELETONS.PREVIEW_TITLE_CLASS} />
      <Skeleton className={EDITOR_SKELETONS.COVER_CLASS} />
      <div className="space-y-2.5">
        {Array.from({ length: EDITOR_SKELETONS.PREVIEW_LINE_COUNT }, (_, i) => (
          <Skeleton
            key={`preview-line-${i}`}
            className={
              i === EDITOR_SKELETONS.PREVIEW_LINE_COUNT - 1
                ? EDITOR_SKELETONS.PREVIEW_LAST_LINE_CLASS
                : EDITOR_SKELETONS.LINE_FULL_CLASS
            }
          />
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        {Array.from({ length: EDITOR_SKELETONS.TAG_COUNT }, (_, i) => (
          <Skeleton key={`tag-${i}`} className={EDITOR_SKELETONS.TAG_CLASS} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for cover / featured image areas in sidebars and modals. */
export function ImagePreviewSkeleton({
  className = EDITOR_SKELETONS.IMAGE_DEFAULT_CLASS,
}: ImagePreviewSkeletonProps) {
  return <Skeleton className={className} aria-hidden />;
}
