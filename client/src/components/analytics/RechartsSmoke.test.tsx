/**
 * Recharts boundary smoke — library mocked so jsdom never needs real SVG layout engines.
 */
import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { describe, expect, it, vi } from "vitest";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="recharts-responsive">{children}</div>
  ),
  AreaChart: ({ children }: { children: ReactNode }) => <div data-testid="recharts-area">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

describe("Recharts smoke (mocked)", () => {
  it("renders chart shell through ResponsiveContainer mock", () => {
    render(
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={[{ x: 1, y: 2 }]}>
          <Area dataKey="y" />
        </AreaChart>
      </ResponsiveContainer>,
    );
    expect(screen.getByTestId("recharts-responsive")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-area")).toBeInTheDocument();
  });
});
