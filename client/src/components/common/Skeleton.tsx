import React from "react";

import type { SkeletonProps } from "@types";


export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-muted/60 dark:bg-muted/30 ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
