import { memo } from "react";

import { APP_CONFIG, BUTTON_SIZES, BUTTON_VARIANTS, DASHBOARD_LAYOUT, ROUTES, SYNC_LABEL } from "@constants";
import type { PostCardProps } from "@types";
import { formatDateTime } from "@utils/dateUtils";
import { isPostScheduleOverdue, isPostScheduled } from "@utils/postStatusDisplay";
import Link from "next/link";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import Button from "@components/common/Button";
import { Card, CardContent } from "@components/common/Card";
import TagChips from "@components/common/TagChips";
import Tooltip from "@components/common/Tooltip";

import PostCoverThumbnail from "./PostCoverThumbnail";
import PostPlatformStatus from "./PostPlatformStatus";
import PostStatusPill from "./PostStatusPill";
import SeoScoreBadge from "./SeoScoreBadge";

/**
 * Mobile post card — compact icon actions; detail-first layout.
 */
const PostCard = memo<PostCardProps>(({ post, onDelete }) => {
  const postId = post.id || post._id;
  const createdAt = post.created_at || post.createdAt;
  const updatedAt = post.updated_at || post.updatedAt;
  const excerpt = post.meta_description?.trim();
  const scheduled = isPostScheduled(post);
  const scheduleOverdue = isPostScheduleOverdue(post);

  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <PostCoverThumbnail src={post.cover_image} title={post.title} size="md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground line-clamp-2">
                  {post.title}
                </h3>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Tooltip content={SYNC_LABEL.EDIT} side="top">
                    <Link href={`${ROUTES.EDITOR}/${postId}`} prefetch={false}>
                      <Button
                        variant={BUTTON_VARIANTS.GHOST}
                        size={BUTTON_SIZES.ICON}
                        className={DASHBOARD_LAYOUT.POST_CARD_ACTION_BTN_CLASS}
                        aria-label={SYNC_LABEL.EDIT_POST_ARIA}
                      >
                        <FiEdit2 className={DASHBOARD_LAYOUT.POST_CARD_ACTION_ICON_CLASS} />
                      </Button>
                    </Link>
                  </Tooltip>
                  <Tooltip content={SYNC_LABEL.DELETE} side="top">
                    <Button
                      variant={BUTTON_VARIANTS.GHOST}
                      size={BUTTON_SIZES.ICON}
                      onClick={() => onDelete(postId)}
                      className={`${DASHBOARD_LAYOUT.POST_CARD_ACTION_BTN_CLASS} text-destructive hover:text-destructive`}
                      aria-label={SYNC_LABEL.DELETE_POST_ARIA}
                    >
                      <FiTrash2 className={DASHBOARD_LAYOUT.POST_CARD_ACTION_ICON_CLASS} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeoScoreBadge post={post} />
                <PostStatusPill status={post.status} scheduledFor={post.scheduled_for} size="SM" />
              </div>
            </div>
          </div>

          {excerpt ? <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{excerpt}</p> : null}

          {scheduled && post.scheduled_for ? (
            <p className="text-[11px] font-medium text-primary">
              {SYNC_LABEL.SCHEDULED_FOR(formatDateTime(post.scheduled_for))}
            </p>
          ) : null}
          {scheduleOverdue ? (
            <p className="text-[11px] font-medium text-muted-foreground">{SYNC_LABEL.SCHEDULE_MISSED}</p>
          ) : null}

          {post.tags && post.tags.length > 0 ? (
            <TagChips
              tags={post.tags}
              limit={APP_CONFIG.TAGS_DISPLAY_LIMIT_CARD}
              chipClassName="max-w-[140px] text-[11px]"
            />
          ) : null}

          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">{SYNC_LABEL.PUBLISHED_ON}</div>
            <PostPlatformStatus post={post} />
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2 text-xs">
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">{SYNC_LABEL.CREATED}</div>
              <div className="truncate text-foreground">{formatDateTime(createdAt)}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-muted-foreground">{SYNC_LABEL.UPDATED}</div>
              <div className="truncate text-foreground">{formatDateTime(updatedAt)}</div>
            </div>
            {post.published_at ? (
              <div className="col-span-2 min-w-0">
                <div className="text-[11px] text-muted-foreground">{SYNC_LABEL.PUBLISHED_DATE}</div>
                <div className="truncate text-foreground">{formatDateTime(post.published_at)}</div>
              </div>
            ) : null}
            {post.canonical_url ? (
              <div className="col-span-2 min-w-0">
                <div className="text-[11px] text-muted-foreground">{SYNC_LABEL.CANONICAL_URL_LABEL}</div>
                <a
                  href={post.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-primary hover:underline"
                >
                  {post.canonical_url}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
