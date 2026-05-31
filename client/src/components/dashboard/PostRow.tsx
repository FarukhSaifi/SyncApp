import React, { memo } from "react";

import { APP_CONFIG, COLOR_CLASSES, PLATFORMS, POST_STATUS, ROUTES, STATUS_CONFIG, SYNC_LABEL } from "@constants";
import type { Post, PostRowProps } from "@types";
import dayjs from "dayjs";
import Link from "next/link";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

import Button from "@components/common/Button";
import { TableCell, TableRow } from "@components/common/Table";

import SeoScoreBadge from "./SeoScoreBadge";

/** API responses may include both camelCase and snake_case fields */
type PostData = Post & {
  id?: string;
  created_at?: string;
  published_at?: string;
};

/**
 * Memoized post row component for better performance
 */
const PostRow = memo<PostRowProps>(({ post, onDelete }) => {
  const getStatusBadge = (status: string, scheduledFor?: string) => {
    if (status === POST_STATUS.DRAFT && scheduledFor && dayjs(scheduledFor).isAfter(dayjs())) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary">Scheduled</span>;
    }
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG[POST_STATUS.DRAFT];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

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

    if (platforms.length === 0) {
      return <span className="text-muted-foreground">{SYNC_LABEL.NOT_PUBLISHED}</span>;
    }

    return <div className="flex flex-wrap gap-2">{platforms}</div>;
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format(APP_CONFIG.DATE_FORMAT);
  };

  const postId = post.id || post._id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="max-w-xs">
          <div className="truncate">{post.title}</div>
          {post.cover_image && <div className="text-xs text-muted-foreground mt-1">{SYNC_LABEL.HAS_COVER_IMAGE}</div>}
          {post.scheduled_for && dayjs(post.scheduled_for).isAfter(dayjs()) && (
            <div className="text-[10px] text-primary mt-0.5 font-medium">
              Schedules for {formatDate(post.scheduled_for)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(post.status, post.scheduled_for)}</TableCell>
      <TableCell>
        <SeoScoreBadge post={post} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-32">
          {post.tags && post.tags.length > 0 ? (
            post.tags.slice(0, APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW).map((tag: string, index: number) => (
              <span
                key={index}
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
      <TableCell>{formatDate(post.created_at || post.createdAt || "")}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link href={`${ROUTES.EDITOR}/${postId}`}>
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
