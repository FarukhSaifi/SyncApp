"use client";

import { Fragment } from "react";

import { DATA_TABLE, SYNC_LABEL } from "@constants";
import type { DataTableProps } from "@types";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@components/common/Table";

import { DataTablePageSizeSelect } from "./DataTablePageSizeSelect";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableToolbar } from "./DataTableToolbar";
import { LoadMoreSentinel } from "./LoadMoreSentinel";
import { SortableTableHead } from "./SortableTableHead";

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  renderRow,
  search,
  toolbarExtra,
  pageSize,
  sort,
  loading = false,
  loadingMore = false,
  empty,
  infiniteScroll,
  pagination,
  mobileRow,
  embedded = false,
  className = "",
}: DataTableProps<T>) {
  const showToolbar = Boolean(search || toolbarExtra);
  const showPagination = Boolean(pagination && pagination.pages >= 1);
  const showFooter = Boolean(pageSize || showPagination);
  const isEmpty = !loading && rows.length === 0;
  const rootClass = embedded ? DATA_TABLE.ROOT_EMBEDDED : DATA_TABLE.ROOT;
  const toolbarClass = embedded ? DATA_TABLE.TOOLBAR_EMBEDDED : undefined;
  const tableShellClass = embedded ? DATA_TABLE.TABLE_SHELL_EMBEDDED : DATA_TABLE.TABLE_SHELL;
  const footerClass = embedded ? DATA_TABLE.FOOTER_EMBEDDED : DATA_TABLE.FOOTER_BAR;
  const mobileListClass = embedded ? DATA_TABLE.MOBILE_LIST_EMBEDDED : DATA_TABLE.MOBILE_LIST;

  const handleSortColumn = (columnId: string) => {
    if (!sort) {
      return;
    }
    if (sort.key !== columnId) {
      sort.onChange({ key: columnId, direction: DATA_TABLE.SORT_ASC });
      return;
    }
    if (sort.direction === DATA_TABLE.SORT_ASC) {
      sort.onChange({ key: columnId, direction: DATA_TABLE.SORT_DESC });
      return;
    }
    sort.onChange({ key: null, direction: DATA_TABLE.SORT_ASC });
  };

  return (
    <div className={`${rootClass} ${className}`.trim()}>
      {showToolbar ? (
        <div className={toolbarClass}>
          <DataTableToolbar search={search} toolbarExtra={toolbarExtra} />
        </div>
      ) : null}

      {isEmpty ? (
        (empty ?? <div className={DATA_TABLE.EMPTY_DEFAULT}>{SYNC_LABEL.DATA_TABLE_NO_RESULTS}</div>)
      ) : (
        <>
          {mobileRow ? (
            <div className={mobileListClass}>
              {rows.map((row) => (
                <div key={getRowId(row)}>{mobileRow(row)}</div>
              ))}
            </div>
          ) : null}

          <div className={`${mobileRow ? DATA_TABLE.DESKTOP_TABLE : ""} ${tableShellClass}`.trim()}>
            <div className={DATA_TABLE.TABLE_SCROLL}>
              <Table className={DATA_TABLE.TABLE_CLASS}>
                <TableHeader>
                  <TableRow className={DATA_TABLE.HEADER_ROW}>
                    {columns.map((col) => (
                      <SortableTableHead
                        key={col.id}
                        columnId={col.id}
                        label={col.header}
                        sortable={col.sortable}
                        sortKey={sort?.key ?? null}
                        sortDirection={sort?.direction ?? DATA_TABLE.SORT_ASC}
                        onSort={sort ? handleSortColumn : undefined}
                        className={col.className}
                      />
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className={DATA_TABLE.TABLE_BODY}>
                  {renderRow
                    ? rows.map((row) => <Fragment key={getRowId(row)}>{renderRow(row)}</Fragment>)
                    : rows.map((row) => (
                        <TableRow key={getRowId(row)}>
                          {columns.map((col) => (
                            <TableCell key={col.id} className={col.className}>
                              {col.cell ? col.cell(row) : null}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {loadingMore ? <p className={DATA_TABLE.LOADING_MORE}>{SYNC_LABEL.DATA_TABLE_LOADING_MORE}</p> : null}

          {infiniteScroll ? (
            <LoadMoreSentinel
              enabled={infiniteScroll.hasMore && !loading && !loadingMore}
              onIntersect={infiniteScroll.onLoadMore}
            />
          ) : null}
        </>
      )}

      {showFooter ? (
        <div className={footerClass}>
          <div className={DATA_TABLE.FOOTER_START}>
            {pageSize ? <DataTablePageSizeSelect pageSize={pageSize} /> : null}
          </div>
          <div className={DATA_TABLE.FOOTER_ACTIONS}>
            {showPagination && pagination ? <DataTablePagination pagination={pagination} loading={loading} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
