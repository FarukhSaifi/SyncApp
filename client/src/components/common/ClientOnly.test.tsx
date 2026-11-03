import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { INFO_MESSAGES } from "@constants/messages";

import ClientOnly from "./ClientOnly";

describe("ClientOnly", () => {
  it("renders children after mount", async () => {
    render(
      <ClientOnly message={INFO_MESSAGES.LOADING}>
        <span>Mounted content</span>
      </ClientOnly>,
    );
    expect(await screen.findByText("Mounted content")).toBeInTheDocument();
  });
});
