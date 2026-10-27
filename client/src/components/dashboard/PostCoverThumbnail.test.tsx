import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@components/common/LazyImage", () => ({
  default: ({ alt, onImageError }: { alt?: string; onImageError?: () => void }) => (
    <img data-testid="cover-image" alt={alt || ""} onError={() => onImageError?.()} />
  ),
}));

import PostCoverThumbnail from "./PostCoverThumbnail";

describe("PostCoverThumbnail", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows placeholder when src is missing", () => {
    const { container } = render(<PostCoverThumbnail src="" title="Draft" />);
    expect(screen.queryByTestId("cover-image")).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("renders lazy image for valid src", () => {
    render(<PostCoverThumbnail src="https://cdn.test/cover.png" title="My post" />);
    expect(screen.getByTestId("cover-image")).toBeInTheDocument();
  });

  it("falls back to placeholder after image error", () => {
    render(<PostCoverThumbnail src="https://cdn.test/broken.png" title="Broken" />);
    fireEvent.error(screen.getByTestId("cover-image"));
    expect(screen.queryByTestId("cover-image")).not.toBeInTheDocument();
  });
});
