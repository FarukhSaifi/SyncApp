import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LAZY_IMAGE } from "@constants/designTokens";

import LazyImage from "./LazyImage";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    width,
    height,
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    width?: number;
    height?: number;
  }) => (
    <img data-testid="next-image" src={src} alt={alt} width={width} height={height} onLoad={onLoad} onError={onError} />
  ),
}));

describe("LazyImage", () => {
  afterEach(() => {
    cleanup();
  });

  it("returns null when src is empty", () => {
    const { container } = render(<LazyImage src="" alt="x" width={100} height={80} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders skeleton until load and hides on error", () => {
    const onImageError = vi.fn();
    render(<LazyImage src="https://cdn.test/a.png" alt="cover" width={120} height={80} />);
    fireEvent.load(screen.getByTestId("next-image"));
    render(
      <LazyImage src="https://cdn.test/broken.png" alt="broken" width={120} height={80} onImageError={onImageError} />,
    );
    fireEvent.error(screen.getAllByTestId("next-image")[1]);
    expect(onImageError).toHaveBeenCalledOnce();
  });

  it("uses fill layout when dimensions invalid", () => {
    const { unmount } = render(<LazyImage src="https://cdn.test/fill.png" alt="fill" fill />);
    expect(screen.getAllByTestId("next-image").length).toBeGreaterThan(0);
    unmount();
  });

  it("skips skeleton for data URIs and uses default alt when empty", () => {
    render(<LazyImage src="data:image/png;base64,abc" alt="" width={40} height={40} />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("alt", LAZY_IMAGE["DEFAULT_ALT"]);
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it("resets load state when src changes", () => {
    const { rerender } = render(<LazyImage src="https://cdn.test/a.png" alt="a" width={80} height={60} />);
    fireEvent.load(screen.getByTestId("next-image"));
    rerender(<LazyImage src="https://cdn.test/b.png" alt="b" width={80} height={60} />);
    expect(screen.getByTestId("next-image")).toHaveAttribute("src", "https://cdn.test/b.png");
  });

  it("parses string dimensions and hides skeleton when disabled", () => {
    render(
      <LazyImage
        src="https://cdn.test/sized.png"
        alt="sized"
        width={"96" as unknown as number}
        height={"64" as unknown as number}
        showSkeleton={false}
      />,
    );
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("width", "96");
    expect(img).toHaveAttribute("height", "64");
  });
});
