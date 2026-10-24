import { DATA_TABLE, SYNC_LABEL } from "@constants";
import type { SortableTableHeadProps } from "@types";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

import { TableHead } from "@components/common/Table";

export function SortableTableHead({
  columnId,
  label,
  sortable = false,
  sortKey,
  sortDirection,
  onSort,
  className = "",
}: SortableTableHeadProps) {
  const headClass = `${DATA_TABLE.HEAD_CELL} ${className}`.trim();

  if (!sortable || !onSort) {
    return <TableHead className={headClass}>{label}</TableHead>;
  }

  const active = sortKey === columnId;
  const ariaSort = active
    ? sortDirection === DATA_TABLE.SORT_ASC
      ? DATA_TABLE.ARIA_SORT_ASC
      : DATA_TABLE.ARIA_SORT_DESC
    : DATA_TABLE.ARIA_SORT_NONE;
  const labelText = typeof label === "string" ? label : columnId;

  return (
    <TableHead className={headClass} aria-sort={ariaSort}>
      <button
        type="button"
        className={DATA_TABLE.SORT_BUTTON}
        onClick={() => {
          onSort(columnId);
        }}
        aria-label={SYNC_LABEL.DATA_TABLE_SORT_ARIA(labelText)}
      >
        <span>{label}</span>
        {active && sortDirection === DATA_TABLE.SORT_ASC ? (
          <FiChevronUp className={DATA_TABLE.SORT_ICON_ACTIVE} aria-hidden />
        ) : (
          <FiChevronDown className={active ? DATA_TABLE.SORT_ICON_ACTIVE : DATA_TABLE.SORT_ICON} aria-hidden />
        )}
      </button>
    </TableHead>
  );
}
