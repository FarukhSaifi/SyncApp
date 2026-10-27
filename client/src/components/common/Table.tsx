import React from "react";

import type {
  TableBodyProps,
  TableCellProps,
  TableHeadProps,
  TableHeaderProps,
  TableProps,
  TableRowProps,
} from "@types";

import { TABLE_UI } from "@constants/designTokens";

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className = "", ...props }, ref) => (
  <div className={TABLE_UI.SCROLL_WRAP_CLASS}>
    <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className = "", ...props }, ref) => (
  <thead ref={ref} className={`[&_tr]:border-b ${className}`} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(({ className = "", ...props }, ref) => (
  <tbody ref={ref} className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className = "", ...props }, ref) => (
  <tr
    ref={ref}
    className={`border-b border-border/60 transition-colors data-[state=selected]:bg-muted ${className}`}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className = "", ...props }, ref) => (
  <th
    ref={ref}
    className={`h-9 px-3 text-left align-middle text-sm font-semibold text-foreground sm:px-4 has-[[role=checkbox]]:pr-0 ${className}`}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className = "", ...props }, ref) => (
  <td
    ref={ref}
    className={`px-3 py-2 align-middle text-sm sm:px-4 has-[[role=checkbox]]:pr-0 ${className}`}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
