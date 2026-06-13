"use client";

import { useEffect, useState } from "react";

import { FiImage } from "react-icons/fi";

import { SYNC_LABEL } from "@constants/messages";

import LazyImage from "@components/common/LazyImage";

const THUMB_SIZES = {
  sm: { width: 56, height: 40, container: "h-10 w-14 shrink-0" },
  md: { width: 72, height: 48, container: "h-12 w-[4.5rem] shrink-0" },
} as const;

type ThumbSize = keyof typeof THUMB_SIZES;

function CoverPlaceholder({ size }: { size: ThumbSize }) {
  const { container } = THUMB_SIZES[size];
  return (
    <div
      className={`${container} rounded-md border border-border bg-muted/40 flex items-center justify-center`}
      aria-hidden
    >
      <FiImage className="h-4 w-4 text-muted-foreground/50" />
    </div>
  );
}

export interface PostCoverThumbnailProps {
  src?: string | null;
  title: string;
  size?: ThumbSize;
}

/** Small lazy-loaded cover preview for dashboard list rows and cards. */
export default function PostCoverThumbnail({ src, title, size = "sm" }: PostCoverThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = src?.trim() ?? "";
  const { width, height, container } = THUMB_SIZES[size];

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed || failed) {
    return <CoverPlaceholder size={size} />;
  }

  return (
    <LazyImage
      src={trimmed}
      alt={SYNC_LABEL.POST_COVER_ALT(title)}
      width={width}
      height={height}
      className="h-full w-full object-cover"
      containerClassName={`${container} rounded-md border border-border`}
      skeletonClassName="absolute inset-0 rounded-md"
      onImageError={() => setFailed(true)}
    />
  );
}
