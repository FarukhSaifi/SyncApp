import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_UI } from "@constants/messages";

vi.mock("@contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: "<svg data-testid=\"mermaid-svg\"></svg>" })),
  },
}));

import MermaidDiagram from "./MermaidDiagram";

describe("MermaidDiagram", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders mermaid svg after successful render", async () => {
    render(<MermaidDiagram source={"flowchart TD\n  A-->B"} />);
    await waitFor(() => {
      expect(screen.getByRole("img", { name: EDITOR_UI.MERMAID_DIAGRAM_ARIA })).toBeInTheDocument();
    });
  });

  it("shows error UI when mermaid.render throws", async () => {
    const mermaid = await import("mermaid");
    vi.mocked(mermaid.default.render).mockRejectedValueOnce(new Error("bad diagram"));
    render(<MermaidDiagram source={"flowchart TD\n  A-->B"} />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(EDITOR_UI.MERMAID_RENDER_ERROR);
    });
  });
});
