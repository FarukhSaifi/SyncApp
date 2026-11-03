import { POST_STATUS, TEST_IDS } from "@constants";
import { render, screen } from "@testing-library/react";
import type { Post } from "@types";
import { describe, expect, it, vi } from "vitest";

import PostRow from "./PostRow";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const post: Post = {
  _id: "p1",
  title: "Row title",
  content_markdown: "Body",
  status: POST_STATUS.DRAFT,
  tags: ["tag1"],
  author: "u1",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

describe("PostRow", () => {
  it("renders title and delete control", () => {
    render(
      <table>
        <tbody>
          <PostRow post={post} onDelete={vi.fn()} />
        </tbody>
      </table>,
    );
    expect(screen.getByTestId(TEST_IDS.POST_ROW)).toHaveAttribute("data-post-title", "Row title");
    expect(screen.getByText("Row title")).toBeInTheDocument();
  });
});
