import React from "react";

import { vi } from "vitest";

/** Shared Recharts stub for dashboard/analytics view tests. */
export function mockRechartsModule(): Record<string, unknown> {
  const Stub = ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "recharts-stub" }, children);
  const Null = () => null;
  return {
    ResponsiveContainer: Stub,
    BarChart: Stub,
    LineChart: Stub,
    PieChart: Stub,
    Bar: Null,
    Line: Null,
    Pie: Null,
    Cell: Null,
    XAxis: Null,
    YAxis: Null,
    CartesianGrid: Null,
    Tooltip: Null,
    Legend: Null,
  };
}

export function installRechartsMock(): void {
  vi.mock("recharts", () => mockRechartsModule());
}
