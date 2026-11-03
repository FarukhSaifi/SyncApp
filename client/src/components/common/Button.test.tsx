import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BUTTON_SIZES, BUTTON_VARIANTS } from "@constants/designTokens";

import Button from "./Button";

describe("Button", () => {
  it("renders children and respects variant/size", () => {
    render(
      <Button variant={BUTTON_VARIANTS.PRIMARY} size={BUTTON_SIZES.SM} disabled>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain("bg-primary");
  });

  it("falls back to default variant for unknown variant", () => {
    render(<Button variant={"unknown-variant" as typeof BUTTON_VARIANTS.DEFAULT}>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toContain("bg-secondary");
  });
});
