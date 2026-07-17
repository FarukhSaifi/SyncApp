import React, { memo } from "react";

import { APP_CONFIG, COLOR_CLASSES, PLATFORMS, ROUTES, SYNC_LABEL } from "@constants";
import type { Post, PostRowProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import { isPostScheduleOverdue, isPostScheduled } from "@utils/postStatusDisplay";
import Link from "next/link";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

import Button from "@components/common/Button";
import { TableCell, TableRow } from "@components/common/Table";

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
 * Memoized post row component for better performance
 */
const PostRow = memo<PostRowProps>(({ post, onDelete }) => {
  const getPlatformStatus = (post: PostData) => {
    const platforms: React.ReactNode[] = [];

    if (post.platform_status?.medium?.published) {
      platforms.push(
        <a
          key={PLATFORMS.MEDIUM}
          href={post.platform_status.medium.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
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
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
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
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
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
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
        >
          <span className="text-primary">●</span>
          <span>{SYNC_LABEL.PLATFORM_LINKEDIN}</span>
        </a>,
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground">{SYNC_LABEL.NOT_PUBLISHED}</span>;
    }

    return <div className="flex flex-wrap gap-2">{platforms}</div>;
  };

  const postId = post.id || post._id;
  const createdAt = post.created_at || post.createdAt;
  const updatedAt = post.updated_at || post.updatedAt;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-start gap-2 max-w-sm">
          <PostCoverThumbnail src={post.cover_image} title={post.title} />
          <div className="min-w-0 flex-1">
            <div className="truncate">{post.title}</div>
            {isPostScheduled(post) && (
              <div className="text-[10px] text-primary mt-0.5 font-medium">
                Schedules for {formatDateTime(post.scheduled_for!)}
              </div>
            )}
            {isPostScheduleOverdue(post) && (
              <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{SYNC_LABEL.SCHEDULE_MISSED}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <PostStatusPill status={post.status} scheduledFor={post.scheduled_for} />
      </TableCell>
      <TableCell>
        <SeoScoreBadge post={post} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-32">
          {post.tags && post.tags.length > 0 ? (
            post.tags.slice(0, APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-primary/15 text-primary text-xs rounded-full truncate"
                title={tag}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">{SYNC_LABEL.NO_TAGS}</span>
          )}
          {post.tags && post.tags.length > APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW && (
            <span className="text-muted-foreground text-xs">
              {SYNC_LABEL.TAGS_MORE(post.tags.length - APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{getPlatformStatus(post)}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(createdAt)}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(updatedAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link href={`${ROUTES.EDITOR}/${postId}`} prefetch={false}>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <FiEdit3 className="h-4 w-4" />
              <span>{SYNC_LABEL.EDIT}</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(postId)}
            className={`flex items-center space-x-1 ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE} ${COLOR_CLASSES.HOVER_DESTRUCTIVE}`}
          >
            <FiTrash2 className="h-4 w-4" />
            <span>{SYNC_LABEL.DELETE}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

PostRow.displayName = "PostRow";

export default PostRow;
