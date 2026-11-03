import { DATA_TABLE } from "@constants";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";


import { useDataTable } from "./useDataTable";

type Row = { id: string; name: string };

describe("useDataTable", () => {
  const rows: Row[] = [
    { id: "2", name: "Bravo" },
    { id: "1", name: "Alpha" },
  ];

  it("returns rows unchanged when sort key is unset", () => {
    const { result } = renderHook(() =>
      useDataTable({
        rows,
        sortFns: { name: (a, b) => a.name.localeCompare(b.name) },
      }),
    );
    expect(result.current.visibleRows).toEqual(rows);
  });

  it("sorts ascending and descending", () => {
    const { result } = renderHook(() =>
      useDataTable({
        rows,
        sortFns: { name: (a, b) => a.name.localeCompare(b.name) },
        initialSort: { key: "name", direction: DATA_TABLE.SORT_ASC },
      }),
    );
    expect(result.current.visibleRows.map((r) => r.name)).toEqual(["Alpha", "Bravo"]);

    act(() => {
      result.current.setSort({ key: "name", direction: DATA_TABLE.SORT_DESC });
    });
    expect(result.current.visibleRows.map((r) => r.name)).toEqual(["Bravo", "Alpha"]);
  });
});
