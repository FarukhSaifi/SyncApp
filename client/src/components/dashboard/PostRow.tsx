import React, { memo } from "react";

import { APP_CONFIG, DASHBOARD_LAYOUT, DATA_TABLE, ROUTES, SYNC_LABEL } from "@constants";
import type { PostRowProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import { isPostScheduleOverdue, isPostScheduled } from "@utils/postStatusDisplay";
import Link from "next/link";
import { FiEdit3, FiTrash2 } from "react-icons/fi";

import { TableCell, TableRow } from "@components/common/Table";
import TagChips from "@components/common/TagChips";
import Tooltip from "@components/common/Tooltip";

import PostCoverThumbnail from "./PostCoverThumbnail";
import PostPlatformStatus from "./PostPlatformStatus";
import PostStatusPill from "./PostStatusPill";
import SeoScoreBadge from "./SeoScoreBadge";

/**
 * Memoized desktop table row for a single post (title, status, SEO, platforms, actions).
 */
const PostRow = memo<PostRowProps>(({ post, onDelete }) => {
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
            {isPostScheduled(post) && post.scheduled_for ? (
              <div className="text-[10px] text-primary mt-0.5 font-medium">
                {SYNC_LABEL.SCHEDULED_FOR(formatDateTime(post.scheduled_for))}
              </div>
            ) : null}
            {isPostScheduleOverdue(post) ? (
              <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{SYNC_LABEL.SCHEDULE_MISSED}</div>
            ) : null}
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
      <TableCell>
        <PostPlatformStatus
          post={post}
          linkClassName={DASHBOARD_LAYOUT.PLATFORM_LINK_ROW_CLASS}
          emptyClassName={DASHBOARD_LAYOUT.PLATFORM_EMPTY_ROW_CLASS}
        />
      </TableCell>
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
