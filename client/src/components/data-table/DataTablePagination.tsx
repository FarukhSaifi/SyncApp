import { DATA_TABLE, SYNC_LABEL } from "@constants";
import type { DataTablePaginationControlsProps } from "@types";
import { getDataTablePageItems } from "@utils/dataTablePagination";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export function DataTablePagination({ pagination, loading = false }: DataTablePaginationControlsProps) {
  const { page, pages, onPrev, onNext, onPageChange } = pagination;
  const pageItems = getDataTablePageItems(page, pages);

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pages || nextPage === page || loading) {
      return;
    }
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }
    if (nextPage < page) {
      onPrev();
      return;
    }
    onNext();
  };

  return (
    <nav className={DATA_TABLE.PAGE_NAV} aria-label={SYNC_LABEL.PAGE_OF(page, pages)}>
      <button
        type="button"
        className={DATA_TABLE.PAGE_BTN_ICON}
        onClick={onPrev}
        disabled={page <= 1 || loading}
        aria-label={SYNC_LABEL.DATA_TABLE_PREV_PAGE_ARIA}
      >
        <FiChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {pageItems.map((item, index) => {
        if (item === "ellipsis") {
          const prev = pageItems[index - 1];
          const ellipsisKey = `ellipsis-after-${typeof prev === "number" ? prev : "start"}`;
          return (
            <span key={ellipsisKey} className={DATA_TABLE.PAGE_ELLIPSIS} aria-hidden>
              …
            </span>
          );
        }

        const isActive = item === page;
        return (
          <button
            key={item}
            type="button"
            className={`${DATA_TABLE.PAGE_BTN} ${isActive ? DATA_TABLE.PAGE_BTN_ACTIVE : ""}`.trim()}
            onClick={() => {
              goToPage(item);
            }}
            disabled={loading}
            aria-label={SYNC_LABEL.DATA_TABLE_PAGE_ARIA(item)}
            aria-current={isActive ? "page" : undefined}
          >
            {SYNC_LABEL.DATA_TABLE_PAGE_LABEL(item)}
          </button>
        );
      })}

      <button
        type="button"
        className={DATA_TABLE.PAGE_BTN_ICON}
        onClick={onNext}
        disabled={page >= pages || loading}
        aria-label={SYNC_LABEL.DATA_TABLE_NEXT_PAGE_ARIA}
      >
        <FiChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
