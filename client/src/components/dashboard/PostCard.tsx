import React, { memo } from "react";

import { APP_CONFIG, COLOR_CLASSES, PLATFORMS, ROUTES, SYNC_LABEL } from "@constants";
import type { Post, PostCardProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import Link from "next/link";
import { FiEdit, FiTrash2 } from "react-icons/fi";

import Button from "@components/common/Button";
import { Card, CardContent } from "@components/common/Card";

import PostCoverThumbnail from "./PostCoverThumbnail";
import PostStatusPill from "./PostStatusPill";
import SeoScoreBadge from "./SeoScoreBadge";

/** API responses may include both camelCase and snake_case fields */
type PostData = Post & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
};

/**
 * Mobile-friendly post card component
 */
const PostCard = memo<PostCardProps>(({ post, onDelete }) => {
  const getPlatformStatus = (post: PostData) => {
    const platforms: React.ReactNode[] = [];

    if (post.platform_status?.medium?.published) {
      platforms.push(
        <a
          key={PLATFORMS.MEDIUM}
          href={post.platform_status.medium.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-0.5 sm:space-x-1 text-primary hover:text-primary/90 text-xs sm:text-sm"
        >
          <span className={COLOR_CLASSES.STATUS_DOT.WARNING}>●</span>
          <span>{SYNC_LABEL.PLATFORM_MEDIUM}</span>
        </a>,
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <a
          key={PLATFORMS.DEVTO}
          href={post.platform_status.devto.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-0.5 sm:space-x-1 text-primary hover:text-primary/90 text-xs sm:text-sm"
        >
          <span className={COLOR_CLASSES.STATUS_DOT.PRIMARY}>●</span>
          <span>{SYNC_LABEL.PLATFORM_DEVTO}</span>
        </a>,
      );
    }

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <a
          key={PLATFORMS.WORDPRESS}
          href={post.platform_status.wordpress.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-0.5 sm:space-x-1 text-primary hover:text-primary/90 text-xs sm:text-sm"
        >
          <span className="text-primary">●</span>
          <span>{SYNC_LABEL.PLATFORM_WORDPRESS}</span>
        </a>,
      );
    }

    if (post.platform_status?.linkedin?.published) {
      platforms.push(
        <a
          key={PLATFORMS.LINKEDIN}
          href={post.platform_status.linkedin.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-0.5 sm:space-x-1 text-primary hover:text-primary/90 text-xs sm:text-sm"
        >
          <span className="text-primary">●</span>
          <span>{SYNC_LABEL.PLATFORM_LINKEDIN}</span>
        </a>,
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground text-xs sm:text-sm">{SYNC_LABEL.NOT_PUBLISHED}</span>;
    }

    return <div className="flex flex-wrap gap-2">{platforms}</div>;
  };

  const postId = post.id || post._id;
  const createdAt = post.created_at || post.createdAt;
  const updatedAt = post.updated_at || post.updatedAt;

  return (
    <Card className="border">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <PostCoverThumbnail src={post.cover_image} title={post.title} size="md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">{post.title}</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeoScoreBadge post={post} />
                <PostStatusPill status={post.status} scheduledFor={post.scheduled_for} size="SM" />
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD).map((tag: string) => (
                <span
                  key={tag}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/15 text-primary text-xs rounded-full truncate max-w-[120px] sm:max-w-none"
                  title={tag}
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD && (
                <span className="text-muted-foreground text-xs self-center">
                  {SYNC_LABEL.TAGS_MORE(post.tags.length - APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD)}
                </span>
              )}
            </div>
          )}

          {/* Platform Status */}
          <div>
            <div className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
              {SYNC_LABEL.PUBLISHED_ON} {getPlatformStatus(post)}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{SYNC_LABEL.CREATED}</div>
              <div className="text-foreground truncate">{formatDateTime(createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{SYNC_LABEL.UPDATED}</div>
              <div className="text-foreground truncate">{formatDateTime(updatedAt)}</div>
            </div>
            {post.published_at && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground">{SYNC_LABEL.PUBLISHED_DATE}</div>
                <div className="text-foreground truncate">{formatDateTime(post.published_at)}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t">
            <Link href={`${ROUTES.EDITOR}/${postId}`} prefetch={false} className="flex-1 min-w-0">
              <Button variant="outline" size="sm" className="w-full">
                <FiEdit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
                <span className="truncate">{SYNC_LABEL.EDIT}</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => onDelete(postId)} className="flex-1 min-w-0">
              <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
              <span className="truncate">{SYNC_LABEL.DELETE}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
