import React, { memo } from "react";

import { COLOR_CLASSES, DASHBOARD_LAYOUT, PLATFORMS, SYNC_LABEL } from "@constants";
import type { PostPlatformStatusProps } from "@types";

/**
 * Published-platform links (Medium / DEV.to / WordPress / LinkedIn) for post lists.
 * Shared by PostCard and PostRow so status dots and labels stay consistent.
 */
const PostPlatformStatus = memo<PostPlatformStatusProps>(
  ({
    post,
    linkClassName = DASHBOARD_LAYOUT.PLATFORM_LINK_CLASS,
    emptyClassName = DASHBOARD_LAYOUT.PLATFORM_EMPTY_CLASS,
  }) => {
    const platforms: React.ReactNode[] = [];

    const pushLink = (key: string, url: string | undefined, label: string, dotClass: string) => {
      if (!url) {
        return;
      }
      platforms.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={linkClassName}>
          <span className={dotClass}>●</span>
          <span>{label}</span>
        </a>,
      );
    };

    const status = post.platform_status;

    if (status?.medium?.published) {
      pushLink(PLATFORMS.MEDIUM, status.medium.url, SYNC_LABEL.PLATFORM_MEDIUM, COLOR_CLASSES.STATUS_DOT.WARNING);
    }
    if (status?.devto?.published) {
      pushLink(PLATFORMS.DEVTO, status.devto.url, SYNC_LABEL.PLATFORM_DEVTO, COLOR_CLASSES.STATUS_DOT.PRIMARY);
    }
    if (status?.wordpress?.published) {
      pushLink(
        PLATFORMS.WORDPRESS,
        status.wordpress.url,
        SYNC_LABEL.PLATFORM_WORDPRESS,
        COLOR_CLASSES.STATUS_DOT.PRIMARY,
      );
    }
    if (status?.linkedin?.published) {
      pushLink(PLATFORMS.LINKEDIN, status.linkedin.url, SYNC_LABEL.PLATFORM_LINKEDIN, COLOR_CLASSES.STATUS_DOT.ACCENT);
    }

    if (platforms.length === 0) {
      return <span className={emptyClassName}>{SYNC_LABEL.NOT_PUBLISHED}</span>;
    }

    return <div className={DASHBOARD_LAYOUT.PLATFORM_WRAP_CLASS}>{platforms}</div>;
  },
);

PostPlatformStatus.displayName = "PostPlatformStatus";

export default PostPlatformStatus;
