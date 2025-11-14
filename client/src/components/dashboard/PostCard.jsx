import React, { memo, useState } from "react";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { STATUS_CONFIG, SYNC_LABEL } from "../../constants";
import { apiClient } from "../../utils/apiClient";
import Button from "../ui/Button";
import { Card, CardContent } from "../ui/Card";

/**
 * Mobile-friendly post card component
 */
const PostCard = memo(({ post, onDelete, onUpdate, toast }) => {
  const [unpublishing, setUnpublishing] = useState(null);

  const handleUnpublish = async (platform) => {
    const postId = post.id || post._id;
    setUnpublishing(platform);
    try {
      const response = await apiClient.unpublishFromPlatform(platform, postId);
      if (response?.success) {
        toast?.success?.("Unpublished", `Post removed from ${platform}`);
        if (onUpdate) {
          onUpdate({ ...post, platform_status: response.data.platformStatus });
        }
      } else {
        toast?.error?.("Error", response?.error || `Failed to unpublish from ${platform}`);
      }
    } catch (error) {
      toast?.error?.("Error", `Failed to unpublish from ${platform}: ${error.message}`);
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
        <div key="medium" className="inline-flex items-center space-x-1">
          <a
            href={post.platform_status.medium.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-0.5 sm:space-x-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
          >
            <span className="text-orange-500">●</span>
            <span>Medium</span>
          </a>
          <button
            onClick={() => handleUnpublish("medium")}
            disabled={unpublishing === "medium"}
            className="text-red-500 hover:text-red-700 ml-0.5 sm:ml-1 flex-shrink-0"
            title={SYNC_LABEL.REMOVE_FROM_MEDIUM}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <div key="devto" className="inline-flex items-center space-x-1">
          <a
            href={post.platform_status.devto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-0.5 sm:space-x-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
          >
            <span className="text-purple-500">●</span>
            <span>DEV.to</span>
          </a>
          <button
            onClick={() => handleUnpublish("devto")}
            disabled={unpublishing === "devto"}
            className="text-red-500 hover:text-red-700 ml-0.5 sm:ml-1 flex-shrink-0"
            title={SYNC_LABEL.REMOVE_FROM_DEVTO}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <div key="wordpress" className="inline-flex items-center space-x-1">
          <a
            href={post.platform_status.wordpress.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-0.5 sm:space-x-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
          >
            <span className="text-blue-500">●</span>
            <span>WordPress</span>
          </a>
          <button
            onClick={() => handleUnpublish("wordpress")}
            disabled={unpublishing === "wordpress"}
            className="text-red-500 hover:text-red-700 ml-0.5 sm:ml-1 flex-shrink-0"
            title={SYNC_LABEL.REMOVE_FROM_WORDPRESS}
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground text-xs sm:text-sm">{SYNC_LABEL.NOT_PUBLISHED}</span>;
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
    <Card className="border">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{post.title}</h3>
              {post.cover_image && (
                <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">📷 Has cover image</div>
              )}
            </div>
            <div className="ml-1 sm:ml-2 flex-shrink-0">{getStatusBadge(post.status)}</div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 5).map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs rounded-full truncate max-w-[120px] sm:max-w-none"
                  title={tag}
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 5 && (
                <span className="text-muted-foreground text-xs self-center">+{post.tags.length - 5} more</span>
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
              <div className="text-xs text-muted-foreground">
                {SYNC_LABEL.CREATED}{" "}
                <div className="text-foreground truncate">{formatDate(post.created_at || post.createdAt)}</div>
              </div>
            </div>
            {post.published_at && (
              <div>
                <div className="text-xs text-muted-foreground">
                  {SYNC_LABEL.PUBLISHED_DATE}{" "}
                  <div className="text-foreground truncate">{formatDate(post.published_at)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t">
            <Link to={`/editor/${postId}`} className="flex-1 min-w-0">
              <Button variant="outline" size="sm" className="w-full">
                <FiEdit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">{SYNC_LABEL.EDIT}</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => onDelete(postId)} className="flex-1 min-w-0">
              <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
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
