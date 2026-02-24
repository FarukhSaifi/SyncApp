import React, { memo, useState } from "react";
import { FiEdit3, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { APP_CONFIG, COLOR_CLASSES, ROUTES, STATUS_CONFIG, SYNC_LABEL } from "../../constants";
import { apiClient } from "../../utils/apiClient";
import Button from "../ui/Button";
import { TableCell, TableRow } from "../ui/Table";
import SeoScoreBadge from "./SeoScoreBadge";

/**
 * Memoized post row component for better performance
 */
const PostRow = memo(({ post, onDelete, onUpdate, toast }) => {
  const [unpublishing, setUnpublishing] = useState(null);

  const handleUnpublish = async (platform) => {
    const postId = post.id || post._id;
    setUnpublishing(platform);
    try {
      const response = await apiClient.unpublishFromPlatform(platform, postId);
      if (response?.success) {
        toast?.success?.(SYNC_LABEL.UNPUBLISHED, SYNC_LABEL.REMOVED_FROM_PLATFORM(platform));
        if (onUpdate) {
          onUpdate({ ...post, platform_status: response.data.platformStatus });
        }
      } else {
        toast?.error?.(SYNC_LABEL.ERROR_TITLE, response?.error || SYNC_LABEL.FAILED_TO_UNPUBLISH_PLATFORM(platform));
      }
    } catch (error) {
      toast?.error?.(SYNC_LABEL.ERROR_TITLE, SYNC_LABEL.FAILED_TO_UNPUBLISH_PLATFORM(platform, error.message));
    } finally {
      setUnpublishing(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  const getPlatformStatus = (post) => {
    const platforms = [];

    if (post.platform_status?.medium?.published) {
      platforms.push(
        <div key="medium" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.medium.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
          >
            <span className={COLOR_CLASSES.STATUS_DOT.WARNING}>●</span>
            <span>{SYNC_LABEL.PLATFORM_MEDIUM}</span>
          </a>
          <button
            onClick={() => handleUnpublish("medium")}
            disabled={unpublishing === "medium"}
            className={`opacity-0 group-hover:opacity-100 transition-opacity ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}`}
            title={SYNC_LABEL.REMOVE_FROM_MEDIUM}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>,
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <div key="devto" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.devto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
          >
            <span className={COLOR_CLASSES.STATUS_DOT.PRIMARY}>●</span>
            <span>{SYNC_LABEL.PLATFORM_DEVTO}</span>
          </a>
          <button
            onClick={() => handleUnpublish("devto")}
            disabled={unpublishing === "devto"}
            className={`opacity-0 group-hover:opacity-100 transition-opacity ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}`}
            title={SYNC_LABEL.REMOVE_FROM_DEVTO}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>,
      );
    }

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <div key="wordpress" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.wordpress.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-primary hover:text-primary/90"
          >
            <span className="text-primary">●</span>
            <span>{SYNC_LABEL.PLATFORM_WORDPRESS}</span>
          </a>
          <button
            onClick={() => handleUnpublish("wordpress")}
            disabled={unpublishing === "wordpress"}
            className={`opacity-0 group-hover:opacity-100 transition-opacity ${COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}`}
            title={SYNC_LABEL.REMOVE_FROM_WORDPRESS}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>,
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground">{SYNC_LABEL.NOT_PUBLISHED}</span>;
    }

    return <div className="flex flex-wrap gap-2">{platforms}</div>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const postId = post.id || post._id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="max-w-xs">
          <div className="truncate">{post.title}</div>
          {post.cover_image && <div className="text-xs text-muted-foreground mt-1">{SYNC_LABEL.HAS_COVER_IMAGE}</div>}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(post.status)}</TableCell>
      <TableCell>
        <SeoScoreBadge post={post} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-32">
          {post.tags && post.tags.length > 0 ? (
            post.tags.slice(0, APP_CONFIG.TAGS_DISPLAY_LIMIT_ROW).map((tag, index) => (
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
      <TableCell>{formatDate(post.created_at || post.createdAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link to={`${ROUTES.EDITOR}/${postId}`}>
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
