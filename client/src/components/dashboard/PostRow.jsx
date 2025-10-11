import React, { memo, useState } from "react";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { STATUS_CONFIG } from "../../constants";
import { apiClient } from "../../utils/apiClient";
import Button from "../ui/Button";
import { TableCell, TableRow } from "../ui/Table";

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
        toast?.success?.("Unpublished", `Post removed from ${platform}`);
        // Update the post in parent component
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
        <div key="medium" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.medium.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <span className="text-orange-500">●</span>
            <span>Medium</span>
          </a>
          <button
            onClick={() => handleUnpublish("medium")}
            disabled={unpublishing === "medium"}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            title="Remove from Medium"
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <div key="devto" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.devto.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <span className="text-purple-500">●</span>
            <span>DEV.to</span>
          </a>
          <button
            onClick={() => handleUnpublish("devto")}
            disabled={unpublishing === "devto"}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            title="Remove from DEV.to"
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <div key="wordpress" className="inline-flex items-center space-x-1 group">
          <a
            href={post.platform_status.wordpress.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <span className="text-blue-500">●</span>
            <span>WordPress</span>
          </a>
          <button
            onClick={() => handleUnpublish("wordpress")}
            disabled={unpublishing === "wordpress"}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            title="Remove from WordPress"
          >
            <FiX className="h-3 w-3" />
          </button>
        </div>
      );
    }

    if (platforms.length === 0) {
      return <span className="text-muted-foreground">Not published</span>;
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
          {post.cover_image && <div className="text-xs text-muted-foreground mt-1">📷 Has cover image</div>}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(post.status)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1 max-w-32">
          {post.tags && post.tags.length > 0 ? (
            post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full truncate"
                title={tag}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">No tags</span>
          )}
          {post.tags && post.tags.length > 3 && (
            <span className="text-muted-foreground text-xs">+{post.tags.length - 3} more</span>
          )}
        </div>
      </TableCell>
      <TableCell>{getPlatformStatus(post)}</TableCell>
      <TableCell>{formatDate(post.created_at || post.createdAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <Link to={`/editor/${postId}`}>
            <Button variant="outline" size="sm">
              <FiEdit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onDelete(postId)}>
            <FiTrash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

PostRow.displayName = "PostRow";

export default PostRow;
