import { useCallback, useMemo, useState } from "react";

import { DATA_TABLE } from "@constants";
import { useDebounce } from "@hooks/useDebounce";
import type { DataTableSortState, UseDataTableOptions, UseDataTableReturn } from "@types";

/**
 * Client-side search + sort helpers for DataTable consumers.
 * Domain hooks own API pagination / append; this only shapes visible rows.
 */
export function useDataTable<T>({
  rows,
  filterFn,
  sortFns,
  initialSort = { key: null, direction: DATA_TABLE.SORT_ASC },
  debounceMs = DATA_TABLE.SEARCH_DEBOUNCE_MS,
}: UseDataTableOptions<T>): UseDataTableReturn<T> {
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<DataTableSortState>(initialSort);
  const debouncedQuery = useDebounce(query, debounceMs);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) {
        return { key, direction: DATA_TABLE.SORT_ASC };
      }
      if (prev.direction === DATA_TABLE.SORT_ASC) {
        return { key, direction: DATA_TABLE.SORT_DESC };
      }
      return { key: null, direction: DATA_TABLE.SORT_ASC };
    });
  }, []);

  const visibleRows = useMemo(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    let next = rows;
    if (trimmed && filterFn) {
      next = rows.filter((row) => filterFn(row, trimmed));
    }

    const sortKey = sort.key;
    if (!sortKey || !sortFns?.[sortKey]) {
      return next;
    }

    const compare = sortFns[sortKey];
    const sorted = [...next].sort(compare);
    if (sort.direction === DATA_TABLE.SORT_DESC) {
      sorted.reverse();
    }
    return sorted;
  }, [rows, debouncedQuery, filterFn, sort, sortFns]);

  return {
    query,
    setQuery,
    debouncedQuery,
    sort,
    setSort,
    toggleSort,
    visibleRows,
  };
}
