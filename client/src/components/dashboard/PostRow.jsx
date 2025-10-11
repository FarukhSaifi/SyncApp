import React, { memo } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { TableCell, TableRow } from "../ui/Table";
import { STATUS_CONFIG } from "../../constants";

/**
 * Memoized post row component for better performance
 */
const PostRow = memo(({ post, onDelete }) => {
  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  const getPlatformStatus = (post) => {
    const platforms = [];

    if (post.platform_status?.medium?.published) {
      platforms.push(
        <a
          key="medium"
          href={post.platform_status.medium.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-orange-500">●</span>
          <span>Medium</span>
        </a>
      );
    }

    if (post.platform_status?.devto?.published) {
      platforms.push(
        <a
          key="devto"
          href={post.platform_status.devto.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-purple-500">●</span>
          <span>DEV.to</span>
        </a>
      );
    }

    if (post.platform_status?.wordpress?.published) {
      platforms.push(
        <a
          key="wordpress"
          href={post.platform_status.wordpress.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
        >
          <span className="text-blue-500">●</span>
          <span>WordPress</span>
        </a>
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

