import { DATA_TABLE, INPUT_SIZES, SYNC_LABEL } from "@constants";
import type { DataTableToolbarProps } from "@types";

import DebouncedSearchInput from "@components/common/DebouncedSearchInput";

export function DataTableToolbar({ search, toolbarExtra }: DataTableToolbarProps) {
  if (!search && !toolbarExtra) {
    return null;
  }

  return (
    <div className={DATA_TABLE.TOOLBAR_CLASS}>
      {search ? (
        <div className={DATA_TABLE.TOOLBAR_SEARCH_WRAP}>
          <DebouncedSearchInput
            value={search.value}
            onChange={search.onChange}
            debounceMs={search.debounceMs ?? DATA_TABLE.SEARCH_DEBOUNCE_MS}
            placeholder={search.placeholder ?? SYNC_LABEL.DATA_TABLE_SEARCH_PLACEHOLDER}
            className={DATA_TABLE.TOOLBAR_SEARCH_INPUT}
            size={INPUT_SIZES.SM}
            aria-label={search["aria-label"] ?? search.placeholder ?? SYNC_LABEL.DATA_TABLE_SEARCH_PLACEHOLDER}
          />
        </div>
      ) : (
        <div />
      )}
      {toolbarExtra ? <div className={DATA_TABLE.TOOLBAR_ACTIONS}>{toolbarExtra}</div> : null}
    </div>
  );
}
