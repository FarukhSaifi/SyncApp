import { INFO_MESSAGES } from "@constants";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { APP_LOGO_VARIANTS, APP_SHELL } from "@constants/designTokens";

import AppLogo from "./AppLogo";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    priority,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
  }) => (
    <img
      data-testid="app-logo"
      src={typeof src === "string" ? src : "logo"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-priority={priority ? "true" : "false"}
    />
  ),
}));

describe("AppLogo", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders header variant with default sizing and alt text", () => {
    render(<AppLogo />);
    const img = screen.getByTestId("app-logo");
    expect(img).toHaveAttribute("alt", INFO_MESSAGES["APP_LOGO_ALT"]);
    expect(img).toHaveAttribute("width", String(APP_SHELL["LOGO_SIZE_PX"]));
    expect(img.className).toContain(APP_SHELL["LOGO_IMAGE_CLASS"]);
  });

  it("renders auth variant and honors custom className and priority", () => {
    render(<AppLogo variant={APP_LOGO_VARIANTS.AUTH} className="custom-logo" priority />);
    const img = screen.getByTestId("app-logo");
    expect(img).toHaveAttribute("width", String(APP_SHELL["LOGO_AUTH_SIZE_PX"]));
    expect(img.className).toBe("custom-logo");
    expect(img).toHaveAttribute("data-priority", "true");
  });
});
