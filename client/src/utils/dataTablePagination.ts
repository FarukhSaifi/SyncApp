import { DATA_TABLE } from "@constants";
import type { DataTablePageItem } from "@types";

/** Build a compact page list with ellipsis for numbered pagination. */
export function getDataTablePageItems(
  page: number,
  pages: number,
  windowSize: number = DATA_TABLE.PAGINATION_WINDOW,
): DataTablePageItem[] {
  if (pages <= 0) {
    return [];
  }
  if (pages <= windowSize) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const sideCount = Math.max(1, Math.floor((windowSize - 3) / 2));
  const items: DataTablePageItem[] = [1];

  const windowStart = Math.max(2, page - sideCount);
  const windowEnd = Math.min(pages - 1, page + sideCount);

  if (windowStart > 2) {
    items.push("ellipsis");
  }

  for (let current = windowStart; current <= windowEnd; current += 1) {
    items.push(current);
  }

  if (windowEnd < pages - 1) {
    items.push("ellipsis");
  }

  items.push(pages);
  return items;
}
