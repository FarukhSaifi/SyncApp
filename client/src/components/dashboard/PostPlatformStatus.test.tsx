import { POST_STATUS, SYNC_LABEL } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import type { Post } from "@types";
import { afterEach, describe, expect, it } from "vitest";

import PostPlatformStatus from "./PostPlatformStatus";

const basePost: Post = {
  _id: "p1",
  title: "Test",
  content_markdown: "Body",
  status: POST_STATUS.PUBLISHED,
  tags: [],
  author: "u1",
};

describe("PostPlatformStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows not published when no platform urls", () => {
    render(<PostPlatformStatus post={basePost} />);
    expect(screen.getByText(SYNC_LABEL.NOT_PUBLISHED)).toBeInTheDocument();
  });

  it("renders published platform links", () => {
    const post: Post = {
      ...basePost,
      platform_status: {
        medium: { published: true, url: "https://medium.com/p/1" },
        devto: { published: true, url: "https://dev.to/u/1" },
        wordpress: { published: true, url: "https://wp.test/1" },
        linkedin: { published: true, url: "https://linkedin.com/post/1" },
      },
    };
    render(<PostPlatformStatus post={post} />);
    expect(screen.getByText(SYNC_LABEL.PLATFORM_MEDIUM)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.PLATFORM_DEVTO)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.PLATFORM_WORDPRESS)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.PLATFORM_LINKEDIN)).toBeInTheDocument();
    const mediumLink = screen.getByText(SYNC_LABEL.PLATFORM_MEDIUM).closest("a");
    expect(mediumLink).toHaveAttribute("href", "https://medium.com/p/1");
    expect(mediumLink).toHaveAttribute("target", "_blank");
    expect(screen.queryByText(SYNC_LABEL.NOT_PUBLISHED)).not.toBeInTheDocument();
    expect(mediumLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("skips unpublished entries even when status object exists", () => {
    const post: Post = {
      ...basePost,
      platform_status: {
        medium: { published: false, url: "https://medium.com/p/hidden" },
      },
    };
    render(<PostPlatformStatus post={post} />);
    expect(screen.getByText(SYNC_LABEL.NOT_PUBLISHED)).toBeInTheDocument();
  });
});
