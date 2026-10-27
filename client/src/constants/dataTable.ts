import { APP_CONFIG } from "./config";

/** Shared DataTable behavior tokens (Dashboard, Users, future lists). */
export const DATA_TABLE = Object.freeze({
  PAGE_SIZE_OPTIONS: Object.freeze([10, 20, 50] as const),
  DEFAULT_PAGE_SIZE: APP_CONFIG.DEFAULT_LIMIT,
  SEARCH_DEBOUNCE_MS: APP_CONFIG.SEARCH_DEBOUNCE_MS,
  SKELETON_ROWS: 5,
  PAGINATION_WINDOW: 7,
  SORT_ASC: "asc" as const,
  SORT_DESC: "desc" as const,
  ARIA_SORT_ASC: "ascending" as const,
  ARIA_SORT_DESC: "descending" as const,
  ARIA_SORT_NONE: "none" as const,
  ROOT: "space-y-3",
  ROOT_EMBEDDED: "flex flex-col",
  TOOLBAR_CLASS: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
  TOOLBAR_EMBEDDED: "border-b border-border px-4 py-3 sm:px-5",
  TOOLBAR_SEARCH_WRAP: "w-full sm:max-w-xs",
  TOOLBAR_SEARCH_ICON_IN_INPUT: "h-4 w-4",
  TOOLBAR_SEARCH_INPUT: "rounded-lg border-border bg-background",
  TOOLBAR_ACTIONS: "flex flex-wrap items-center gap-2",
  TABLE_SHELL: "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
  TABLE_SHELL_EMBEDDED: "min-w-0 overflow-hidden",
  TABLE_SCROLL: "overflow-x-auto",
  TABLE_CLASS: "w-full min-w-[640px] caption-bottom text-sm",
  TABLE_BODY:
    "[&_tr:nth-child(even)]:bg-muted/40 [&_tr:hover]:bg-muted/60 [&_td]:px-3 [&_td]:py-2 [&_td]:align-middle sm:[&_td]:px-4",
  DESKTOP_TABLE: "hidden md:block",
  MOBILE_LIST: "md:hidden space-y-3",
  MOBILE_LIST_EMBEDDED: "md:hidden space-y-3 p-4 sm:px-5",
  HEADER_ROW: "border-b border-border bg-muted/70 hover:bg-muted/70",
  HEAD_CELL: "h-9 px-3 text-left align-middle text-sm font-semibold text-foreground sm:px-4",
  SORT_BUTTON:
    "inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-primary",
  SORT_ICON: "h-3.5 w-3.5 shrink-0 text-muted-foreground",
  SORT_ICON_ACTIVE: "h-3.5 w-3.5 shrink-0 text-primary",
  ACTIONS_CELL: "text-right",
  ACTIONS_WRAP: "flex items-center justify-end gap-1.5",
  ACTION_BTN:
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-primary transition-colors hover:bg-primary/10",
  ACTION_BTN_DANGER:
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
  ACTION_ICON: "h-4 w-4",
  EMPTY_DEFAULT: "px-4 py-8 text-center text-sm text-muted-foreground sm:px-5",
  PAGE_SIZE_LABEL:
    "flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto sm:justify-start",
  PAGE_SIZE_LABEL_TEXT: "hidden whitespace-nowrap sm:inline",
  PAGE_SIZE_LABEL_TEXT_MOBILE: "inline whitespace-nowrap sm:hidden",
  PAGE_SIZE_SELECT_CLASS: "min-w-[5.5rem] flex-1 sm:min-w-[6.5rem] sm:flex-none",
  TAG_WRAP: "flex flex-wrap gap-1",
  TAG_CHIP: "max-w-full truncate rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary",
  TAG_MORE:
    "inline-flex cursor-help items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
  FOOTER_BAR: "flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
  FOOTER_EMBEDDED:
    "flex flex-col items-stretch gap-3 border-t border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5",
  FOOTER_START: "flex min-w-0 w-full items-center sm:w-auto sm:flex-1",
  FOOTER_ACTIONS: "flex w-full flex-wrap items-center justify-center gap-1.5 sm:w-auto sm:justify-end",
  PAGE_NAV: "inline-flex max-w-full flex-wrap items-center justify-center gap-1 sm:gap-1.5",
  PAGE_BTN:
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:min-w-8",
  PAGE_BTN_ACTIVE: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
  PAGE_BTN_ICON:
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors hover:bg-primary/15 hover:text-primary disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:w-8",
  PAGE_ELLIPSIS: "inline-flex h-9 min-w-7 items-center justify-center text-sm text-muted-foreground sm:h-8 sm:min-w-8",
  SKELETON_LIST: "space-y-2",
  SKELETON_ROW: "h-12 animate-pulse rounded-md bg-muted/60",
} as const);

/** Dashboard posts column ids (sortable keys). */
export const POST_TABLE_COLUMNS = Object.freeze({
  TITLE: "title",
  STATUS: "status",
  SEO: "seo",
  TAGS: "tags",
  PUBLISHED_ON: "published_on",
  CREATED: "created",
  UPDATED: "updated",
  ACTIONS: "actions",
} as const);

/** Users table column ids (sortable keys). */
export const USER_TABLE_COLUMNS = Object.freeze({
  USER: "user",
  EMAIL: "email",
  ROLE: "role",
  STATUS: "status",
  JOINED: "joined",
  UPDATED: "updated",
  LAST_LOGIN: "last_login",
  ACTIONS: "actions",
} as const);
