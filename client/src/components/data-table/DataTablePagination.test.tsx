import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DataTablePaginationControlsProps } from "@types";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SYNC_LABEL } from "@constants/messages";

import { DataTablePagination } from "./DataTablePagination";

function buildPagination(
  overrides: Partial<DataTablePaginationControlsProps["pagination"]> = {},
): DataTablePaginationControlsProps["pagination"] {
  return {
    page: 2,
    pages: 10,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onPageChange: vi.fn(),
    ...overrides,
  };
}

describe("DataTablePagination", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls onPageChange for numbered page clicks", async () => {
    const pagination = buildPagination();
    render(<DataTablePagination pagination={pagination} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PAGE_ARIA(4) }));
    expect(pagination.onPageChange).toHaveBeenCalledWith(4);
  });

  it("falls back to onPrev/onNext when onPageChange is missing", async () => {
    const pagination = buildPagination({ onPageChange: undefined });
    render(<DataTablePagination pagination={pagination} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PAGE_ARIA(1) }));
    expect(pagination.onPrev).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PAGE_ARIA(3) }));
    expect(pagination.onNext).toHaveBeenCalled();
  });

  it("disables navigation while loading", () => {
    const pagination = buildPagination({ page: 1 });
    render(<DataTablePagination pagination={pagination} loading />);
    expect(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PREV_PAGE_ARIA })).toBeDisabled();
    expect(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_NEXT_PAGE_ARIA })).toBeDisabled();
  });

  it("ignores invalid page navigation", async () => {
    const pagination = buildPagination({ page: 2 });
    render(<DataTablePagination pagination={pagination} />);
    await userEvent.click(screen.getByRole("button", { name: SYNC_LABEL.DATA_TABLE_PAGE_ARIA(2) }));
    expect(pagination.onPageChange).not.toHaveBeenCalled();
  });
});
