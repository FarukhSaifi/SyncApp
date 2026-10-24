import { useMemo } from "react";

import { DATA_TABLE, INPUT_SIZES, SYNC_LABEL } from "@constants";
import type { DataTablePageSizeSelectProps, SelectOption } from "@types";

import Select from "@components/common/Select";

export function DataTablePageSizeSelect({ pageSize }: DataTablePageSizeSelectProps) {
  const pageOptions = pageSize.options ?? DATA_TABLE.PAGE_SIZE_OPTIONS;
  const options = useMemo<SelectOption[]>(
    () =>
      pageOptions.map((size) => ({
        value: String(size),
        label: SYNC_LABEL.DATA_TABLE_PAGE_SIZE_OPTION(size),
      })),
    [pageOptions],
  );

  return (
    <label className={DATA_TABLE.PAGE_SIZE_LABEL}>
      <span className={DATA_TABLE.PAGE_SIZE_LABEL_TEXT}>{SYNC_LABEL.DATA_TABLE_PAGE_SIZE}</span>
      <Select
        fullWidth={false}
        size={INPUT_SIZES.SM}
        className={DATA_TABLE.PAGE_SIZE_SELECT_CLASS}
        value={String(pageSize.value)}
        aria-label={SYNC_LABEL.DATA_TABLE_PAGE_SIZE_ARIA}
        options={options}
        onChange={(e) => {
          pageSize.onChange(Number(e.target.value));
        }}
      />
    </label>
  );
}
