import React, { memo } from "react";

import { APP_CONFIG, COLOR_CLASSES, DATA_TABLE, PLATFORMS, ROUTES, SYNC_LABEL } from "@constants";
import type { PostData, PostRowProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import { isPostScheduleOverdue, isPostScheduled } from "@utils/postStatusDisplay";
import Link from "next/link";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

import { TableCell, TableRow } from "@components/common/Table";
import TagChips from "@components/common/TagChips";
import Tooltip from "@components/common/Tooltip";

import PostCoverThumbnail from "./PostCoverThumbnail";
import PostStatusPill from "./PostStatusPill";
import SeoScoreBadge from "./SeoScoreBadge";

/**
 * Memoized post row component for better performance
 */
const PostRow = memo<PostRowProps>(({ post, onDelete }) => {
  const getPlatformStatus = (rowPost: PostData) => {
    const platforms: React.ReactNode[] = [];

    if (rowPost.platform_status?.medium?.published) {
      platforms.push(
        <a
          key={PLATFORMS.MEDIUM}
          href={rowPost.platform_status.medium.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
        >
          <span className={COLOR_CLASSES.STATUS_DOT.WARNING}>●</span>
          <span>{SYNC_LABEL.PLATFORM_MEDIUM}</span>
        </a>,
      );
    }

    if (rowPost.platform_status?.devto?.published) {
      platforms.push(
        <a
          key={PLATFORMS.DEVTO}
          href={rowPost.platform_status.devto.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
        >
          <span className={COLOR_CLASSES.STATUS_DOT.PRIMARY}>●</span>
          <span>{SYNC_LABEL.PLATFORM_DEVTO}</span>
        </a>,
      );
    }

    if (rowPost.platform_status?.wordpress?.published) {
      platforms.push(
        <a
          key={PLATFORMS.WORDPRESS}
          href={rowPost.platform_status.wordpress.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
        >
          <span className="text-primary">●</span>
          <span>{SYNC_LABEL.PLATFORM_WORDPRESS}</span>
        </a>,
      );
    }

    if (rowPost.platform_status?.linkedin?.published) {
      platforms.push(
        <a
          key={PLATFORMS.LINKEDIN}
          href={rowPost.platform_status.linkedin.url}
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
        <TagChips tags={post.tags ?? []} limit={APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW} className="max-w-32" />
      </TableCell>
      <TableCell>{getPlatformStatus(post)}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(createdAt)}</TableCell>
      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{formatDateTime(updatedAt)}</TableCell>
      <TableCell className={DATA_TABLE.ACTIONS_CELL}>
        <div className={DATA_TABLE.ACTIONS_WRAP}>
          <Tooltip content={SYNC_LABEL.EDIT} side="top">
            <Link href={`${ROUTES.EDITOR}/${postId}`} prefetch={false} aria-label={SYNC_LABEL.EDIT}>
              <span className={DATA_TABLE.ACTION_BTN}>
                <FiEdit3 className={DATA_TABLE.ACTION_ICON} aria-hidden />
              </span>
            </Link>
          </Tooltip>
          <Tooltip content={SYNC_LABEL.DELETE} side="top">
            <button
              type="button"
              onClick={() => onDelete(postId)}
              className={DATA_TABLE.ACTION_BTN_DANGER}
              aria-label={SYNC_LABEL.DELETE}
            >
              <FiTrash2 className={DATA_TABLE.ACTION_ICON} aria-hidden />
            </button>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
});

PostRow.displayName = "PostRow";

export default PostRow;
