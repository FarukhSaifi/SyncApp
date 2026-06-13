import type { SkeletonProps } from "@types";

/** Block-level span so skeletons are valid inside <p>, <h3>, and other phrasing-only parents. */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded bg-muted/60 dark:bg-muted/30 ${className ?? ""}`}
      {...props}
    />
  );
}

export default Skeleton;
