import { DATA_TABLE, INPUT_SIZES, SYNC_LABEL } from "@constants";
import type { DataTableToolbarProps } from "@types";
import { FiSearch } from "react-icons/fi";

import Input from "@components/common/Input";

export function DataTableToolbar({ search, toolbarExtra }: DataTableToolbarProps) {
  if (!search && !toolbarExtra) {
    return null;
  }

  return (
    <div className={DATA_TABLE.TOOLBAR_CLASS}>
      {search ? (
        <div className={DATA_TABLE.TOOLBAR_SEARCH_WRAP}>
          <FiSearch className={DATA_TABLE.TOOLBAR_SEARCH_ICON} />
          <Input
            value={search.value}
            onChange={(e) => {
              search.onChange(e.target.value);
            }}
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
