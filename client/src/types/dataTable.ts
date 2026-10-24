import type { ReactNode } from "react";

export type DataTableSortDirection = "asc" | "desc";

export type DataTablePageItem = number | "ellipsis";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  sortable?: boolean;
  className?: string;
  /** Used when `renderRow` is not provided */
  cell?: (row: T) => ReactNode;
}

export interface DataTableSortState {
  key: string | null;
  direction: DataTableSortDirection;
}

export interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export interface DataTablePageSizeProps {
  value: number;
  options?: readonly number[];
  onChange: (value: number) => void;
}

export interface DataTableSortProps {
  key: string | null;
  direction: DataTableSortDirection;
  onChange: (next: DataTableSortState) => void;
}

export interface DataTableInfiniteScrollProps {
  hasMore: boolean;
  onLoadMore: () => void;
}

export interface DataTablePaginationProps {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
  /** Jump to a specific page (numbered pager). Falls back to prev/next when omitted. */
  onPageChange?: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Full row renderer (keeps existing PostRow / UserTableRow). Falls back to column.cell */
  renderRow?: (row: T) => ReactNode;
  search?: DataTableSearchProps;
  toolbarExtra?: ReactNode;
  pageSize?: DataTablePageSizeProps;
  sort?: DataTableSortProps;
  loading?: boolean;
  loadingMore?: boolean;
  empty?: ReactNode;
  infiniteScroll?: DataTableInfiniteScrollProps;
  pagination?: DataTablePaginationProps;
  mobileRow?: (row: T) => ReactNode;
  /** When true, drop nested card chrome (parent Card already provides border/padding). */
  embedded?: boolean;
  className?: string;
}

export interface DataTableToolbarProps {
  search?: DataTableSearchProps;
  toolbarExtra?: ReactNode;
}

export interface DataTablePageSizeSelectProps {
  pageSize: DataTablePageSizeProps;
}

export interface DataTablePaginationControlsProps {
  pagination: DataTablePaginationProps;
  loading?: boolean;
}

export interface SortableTableHeadProps {
  columnId: string;
  label: ReactNode;
  sortable?: boolean;
  sortKey: string | null;
  sortDirection: DataTableSortDirection;
  onSort?: (columnId: string) => void;
  className?: string;
}

export interface LoadMoreSentinelProps {
  enabled: boolean;
  onIntersect: () => void;
}

export interface UseDataTableOptions<T> {
  rows: T[];
  filterFn?: (row: T, query: string) => boolean;
  sortFns?: Partial<Record<string, (a: T, b: T) => number>>;
  initialSort?: DataTableSortState;
  debounceMs?: number;
}

export interface UseDataTableReturn<T> {
  query: string;
  setQuery: (value: string) => void;
  debouncedQuery: string;
  sort: DataTableSortState;
  setSort: (next: DataTableSortState) => void;
  toggleSort: (key: string) => void;
  visibleRows: T[];
}
