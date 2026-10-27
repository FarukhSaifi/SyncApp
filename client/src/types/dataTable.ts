import type { ReactNode } from "react";

import { DATA_TABLE } from "../constants/dataTable";

export type DataTableSortDirection = typeof DATA_TABLE.SORT_ASC | typeof DATA_TABLE.SORT_DESC;

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
  /** Called with the debounced search string (UI input updates immediately). */
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  /** Override default `DATA_TABLE.SEARCH_DEBOUNCE_MS`. */
  debounceMs?: number;
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
  empty?: ReactNode;
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

export interface UseDataTableOptions<T> {
  rows: T[];
  sortFns?: Partial<Record<string, (a: T, b: T) => number>>;
  initialSort?: DataTableSortState;
}

export interface UseDataTableReturn<T> {
  sort: DataTableSortState;
  setSort: (next: DataTableSortState) => void;
  visibleRows: T[];
}
