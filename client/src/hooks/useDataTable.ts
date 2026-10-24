import { useMemo, useState } from "react";

import { DATA_TABLE } from "@constants";
import type { DataTableSortState, UseDataTableOptions, UseDataTableReturn } from "@types";

/**
 * Client-side sort helpers for DataTable consumers.
 * Domain hooks own API pagination and search; this only shapes visible row order.
 */
export function useDataTable<T>({
  rows,
  sortFns,
  initialSort = { key: null, direction: DATA_TABLE.SORT_ASC },
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const [sort, setSort] = useState<DataTableSortState>(initialSort);

  const visibleRows = useMemo(() => {
    const sortKey = sort.key;
    if (!sortKey || !sortFns?.[sortKey]) {
      return rows;
    }

    const compare = sortFns[sortKey];
    const sorted = [...rows].sort(compare);
    if (sort.direction === DATA_TABLE.SORT_DESC) {
      sorted.reverse();
    }
    return sorted;
  }, [rows, sort, sortFns]);

  return {
    sort,
    setSort,
    visibleRows,
  };
}
