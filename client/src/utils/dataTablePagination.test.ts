import { describe, expect, it } from "vitest";

import { getDataTablePageItems } from "./dataTablePagination";

describe("getDataTablePageItems", () => {
  it("returns empty list when pages is zero", () => {
    expect(getDataTablePageItems(1, 0)).toEqual([]);
  });

  it("returns contiguous pages when within window", () => {
    expect(getDataTablePageItems(2, 5, 7)).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipsis when page window is compressed", () => {
    const items = getDataTablePageItems(10, 20, 7);
    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(20);
    expect(items).toContain("ellipsis");
  });
});
