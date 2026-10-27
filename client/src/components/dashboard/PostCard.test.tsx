import React from "react";

import { POST_STATUS, SYNC_LABEL } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Post } from "@types";
import { afterEach, describe, expect, it, vi } from "vitest";

import PostCard from "./PostCard";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const post: Post = {
  _id: "p1",
  title: "Card title",
  content_markdown: "Body",
  status: POST_STATUS.DRAFT,
  tags: ["react", "vitest"],
  meta_description: "Short excerpt",
  author: "u1",
  seo_score: 72,
  scheduled_for: new Date(Date.now() + 86400000).toISOString(),
};

describe("PostCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title, tags, excerpt, and edit link", () => {
    render(<PostCard post={post} onDelete={vi.fn()} />);
    expect(screen.getByText("Card title")).toBeInTheDocument();
    expect(screen.getByText("#react")).toBeInTheDocument();
    expect(screen.getByText("Short excerpt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SYNC_LABEL.EDIT_POST_ARIA }).closest("a")).toHaveAttribute(
      "href",
      "/editor/p1",
    );
  });

  it("calls onDelete from trash control", async () => {
    const onDelete = vi.fn();
    render(<PostCard post={post} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DELETE_POST_ARIA }));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("shows schedule overdue, published date, and canonical link", () => {
    const overdue: Post = {
      ...post,
      slug: "card-2",
      status: POST_STATUS.PUBLISHED,
      scheduled_for: new Date(Date.now() - 86400000).toISOString(),
      canonical_url: "https://example.com/post",
    };
    render(<PostCard post={overdue} onDelete={vi.fn()} />);
    expect(screen.getByText(SYNC_LABEL.SCHEDULE_MISSED)).toBeInTheDocument();
    expect(screen.getByText(SYNC_LABEL.PUBLISHED_DATE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/post" })).toHaveAttribute(
      "href",
      "https://example.com/post",
    );
  });
});
