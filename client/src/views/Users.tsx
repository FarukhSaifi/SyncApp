"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import DataTable from "@components/data-table/DataTable";
import UserCard from "@components/users/UserCard";
import UserTableRow from "@components/users/UserTableRow";
import {
  APP_CONFIG,
  BUTTON_VARIANTS,
  COLOR_CLASSES,
  DASHBOARD_LAYOUT,
  DATA_TABLE,
  ERROR_MESSAGES,
  PLACEHOLDERS,
  SUCCESS_MESSAGES,
  SYNC_LABEL,
  TOAST_TITLES,
  USER_ROLES,
  USER_ROLE_OPTIONS,
  USER_TABLE_COLUMNS,
  USER_VERIFIED_FILTER,
  type UserRoleOption,
} from "@constants";
import { useDataTable } from "@hooks/useDataTable";
import { useDebounce } from "@hooks/useDebounce";
import { useToast } from "@hooks/useToast";
import type { AddUserForm, DataTableColumn, EditForm, PaginationState, User, UserDeleteConfirmState } from "@types";
import { apiClient } from "@utils/apiClient";
import { logError } from "@utils/logger";
import { FiPlus, FiRefreshCw, FiSearch, FiUser, FiX } from "react-icons/fi";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import ConfirmationModal from "@components/common/ConfirmationModal";
import Input from "@components/common/Input";
import Modal from "@components/common/Modal";
import Select from "@components/common/Select";
import Textarea from "@components/common/Textarea";

const initialAddForm: AddUserForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  bio: "",
  avatar: "",
  role: USER_ROLES.USER,
  isVerified: false,
};

function UsersTableSkeleton({ rows = DATA_TABLE.SKELETON_ROWS }: { rows?: number }) {
  return (
    <div className={DATA_TABLE.SKELETON_LIST}>
      {Array.from({ length: rows }, (_, i) => i).map((row) => (
        <div key={`users-skeleton-row-${row}`} className={DATA_TABLE.SKELETON_ROW} />
      ))}
    </div>
  );
}

const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>(USER_VERIFIED_FILTER.ALL);
  const [page, setPage] = useState<number>(1);
  const [pageLimit, setPageLimit] = useState<number>(DATA_TABLE.DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: DATA_TABLE.DEFAULT_PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ role: "", isVerified: false });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<AddUserForm>(initialAddForm);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<UserDeleteConfirmState>({
    isOpen: false,
    userId: null,
    username: "",
  });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {
        page,
        limit: pageLimit,
        ...(debouncedSearch?.trim() && { search: debouncedSearch.trim() }),
        ...(roleFilter && { role: roleFilter }),
      };
      const response = await apiClient.getUsers(params);
      if (response?.success) {
        const list = Array.isArray(response.data) ? response.data : [];
        setUsers(list);
        setPagination(
          (response.pagination as unknown as PaginationState) ?? {
            page: 1,
            limit: pageLimit,
            total: 0,
            pages: 1,
          },
        );
      } else {
        setError(response?.error || ERROR_MESSAGES.FAILED_TO_LOAD_USERS);
      }
    } catch (err) {
      logError("Error fetching users", err);
      setError((err as Error)?.message || ERROR_MESSAGES.FAILED_TO_LOAD_USERS);
      toast.apiError((err as Error)?.message || ERROR_MESSAGES.FAILED_TO_LOAD_USERS);
    } finally {
      setLoading(false);
    }
  }, [page, pageLimit, debouncedSearch, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredByVerified = useMemo(() => {
    if (verifiedFilter === USER_VERIFIED_FILTER.ALL) {
      return users;
    }
    if (verifiedFilter === USER_VERIFIED_FILTER.VERIFIED) {
      return users.filter((u) => u.isVerified);
    }
    return users.filter((u) => !u.isVerified);
  }, [users, verifiedFilter]);

  const userSortFns = useMemo(
    () => ({
      [USER_TABLE_COLUMNS.USER]: (a: User, b: User) => (a.username || "").localeCompare(b.username || ""),
      [USER_TABLE_COLUMNS.EMAIL]: (a: User, b: User) => (a.email || "").localeCompare(b.email || ""),
      [USER_TABLE_COLUMNS.ROLE]: (a: User, b: User) => (a.role || "").localeCompare(b.role || ""),
      [USER_TABLE_COLUMNS.STATUS]: (a: User, b: User) => Number(a.isVerified) - Number(b.isVerified),
      [USER_TABLE_COLUMNS.JOINED]: (a: User, b: User) =>
        String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
      [USER_TABLE_COLUMNS.UPDATED]: (a: User, b: User) =>
        String(a.updatedAt || "").localeCompare(String(b.updatedAt || "")),
      [USER_TABLE_COLUMNS.LAST_LOGIN]: (a: User, b: User) =>
        String(a.lastLogin || "").localeCompare(String(b.lastLogin || "")),
    }),
    [],
  );

  const { sort, setSort, visibleRows } = useDataTable<User>({
    rows: filteredByVerified,
    sortFns: userSortFns,
  });

  const userColumns = useMemo<DataTableColumn<User>[]>(
    () => [
      { id: USER_TABLE_COLUMNS.USER, header: SYNC_LABEL.TABLE_USER, sortable: true },
      { id: USER_TABLE_COLUMNS.EMAIL, header: SYNC_LABEL.TABLE_EMAIL, sortable: true },
      { id: USER_TABLE_COLUMNS.ROLE, header: SYNC_LABEL.TABLE_ROLE, sortable: true },
      { id: USER_TABLE_COLUMNS.STATUS, header: SYNC_LABEL.TABLE_STATUS, sortable: true },
      { id: USER_TABLE_COLUMNS.JOINED, header: SYNC_LABEL.TABLE_JOINED, sortable: true },
      { id: USER_TABLE_COLUMNS.UPDATED, header: SYNC_LABEL.TABLE_UPDATED, sortable: true },
      { id: USER_TABLE_COLUMNS.LAST_LOGIN, header: SYNC_LABEL.TABLE_LAST_LOGIN, sortable: true },
      { id: USER_TABLE_COLUMNS.ACTIONS, header: SYNC_LABEL.TABLE_ACTIONS, className: DATA_TABLE.ACTIONS_CELL },
    ],
    [],
  );

  const hasActiveFilters = Boolean(searchInput?.trim() || roleFilter || verifiedFilter !== USER_VERIFIED_FILTER.ALL);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    setRoleFilter("");
    setVerifiedFilter(USER_VERIFIED_FILTER.ALL);
    setPage(1);
  }, []);

  const handleDeleteClick = useCallback((userId: string, username: string) => {
    setDeleteConfirm({ isOpen: true, userId, username });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const { userId, username } = deleteConfirm;
    if (!userId) return;

    setDeleting(true);
    try {
      const response = await apiClient.deleteUser(userId);
      if (response?.success) {
        setDeleteConfirm({ isOpen: false, userId: null, username: "" });
        toast.success(TOAST_TITLES.USER_DELETED, response.message || SUCCESS_MESSAGES.USER_DELETED(username));
        fetchUsers();
      } else {
        toast.apiError(response?.error || response?.message || SYNC_LABEL.FAILED_TO_DELETE_USER);
      }
    } catch (err) {
      logError("Error deleting user", err);
      toast.apiError((err as Error)?.message || SYNC_LABEL.FAILED_TO_DELETE_USER);
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, toast, fetchUsers]);

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || USER_ROLES.USER,
      isVerified: user.isVerified ?? false,
    });
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingUser || updating) return;

    const username = editingUser.username;
    setUpdating(true);
    try {
      const response = await apiClient.updateUser(editingUser._id, editForm);
      if (response?.success) {
        setEditingUser(null);
        toast.success(TOAST_TITLES.USER_UPDATED, response.message || SUCCESS_MESSAGES.USER_UPDATED(username));
        fetchUsers();
      } else {
        toast.apiError(response?.error || response?.message || SYNC_LABEL.FAILED_TO_UPDATE_USER);
      }
    } catch (err) {
      logError("Error updating user", err);
      toast.apiError((err as Error)?.message || SYNC_LABEL.FAILED_TO_UPDATE_USER);
    } finally {
      setUpdating(false);
    }
  }, [editingUser, editForm, updating, toast, fetchUsers]);

  const handleAddUser = useCallback(async () => {
    if (!addForm.username?.trim() || !addForm.email?.trim()) {
      toast.validationError(SYNC_LABEL.USERNAME_EMAIL_REQUIRED);
      return;
    }
    setCreating(true);
    try {
      const response = await apiClient.createUser(addForm);
      if (response?.success) {
        toast.success(
          TOAST_TITLES.USER_CREATED,
          SUCCESS_MESSAGES.USER_CREATED(response.data?.username ?? addForm.username),
        );
        setShowAddModal(false);
        setAddForm(initialAddForm);
        fetchUsers();
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_CREATE_USER);
      }
    } catch (err) {
      logError("Error creating user", err);
      toast.apiError((err as Error)?.message || SYNC_LABEL.FAILED_TO_CREATE_USER);
    } finally {
      setCreating(false);
    }
  }, [addForm, toast, fetchUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{SYNC_LABEL.LOADING_USERS}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.USER_MANAGEMENT_TITLE}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm">
            {SYNC_LABEL.USER_MANAGEMENT_DESCRIPTION}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="flex items-center gap-2">
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm">{SYNC_LABEL.REFRESH}</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span className="text-sm">{SYNC_LABEL.ADD_USER}</span>
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`${COLOR_CLASSES.ALERT_BG.DESTRUCTIVE} ${COLOR_CLASSES.ALERT_TEXT.DESTRUCTIVE} px-4 py-3 rounded-lg flex items-center justify-between gap-3`}
        >
          <div className="min-w-0">
            <p className="font-medium">{ERROR_MESSAGES.FAILED_TO_LOAD_USERS}</p>
            <p className="text-sm truncate">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="shrink-0">
            <FiRefreshCw className="h-4 w-4 mr-1" />
            {SYNC_LABEL.RETRY}
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder={SYNC_LABEL.PLACEHOLDER_SEARCH_USERS}
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  aria-label={SYNC_LABEL.PLACEHOLDER_SEARCH_USERS}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <Select
                  value={roleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-40"
                  aria-label={SYNC_LABEL.TABLE_ROLE}
                  options={[
                    { value: "", label: PLACEHOLDERS.ALL_ROLES },
                    ...USER_ROLE_OPTIONS.map((opt: UserRoleOption) => ({
                      value: opt.value,
                      label: opt.label,
                    })),
                  ]}
                />
                <Select
                  value={verifiedFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVerifiedFilter(e.target.value)}
                  className="w-full sm:w-36"
                  aria-label={SYNC_LABEL.TABLE_STATUS}
                  options={[
                    { value: USER_VERIFIED_FILTER.ALL, label: SYNC_LABEL.FILTER_ALL },
                    { value: USER_VERIFIED_FILTER.VERIFIED, label: SYNC_LABEL.VERIFIED },
                    { value: USER_VERIFIED_FILTER.UNVERIFIED, label: SYNC_LABEL.UNVERIFIED },
                  ]}
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                    <FiX className="h-4 w-4 mr-1" />
                    {SYNC_LABEL.CLEAR_ALL_FILTERS}
                  </Button>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {SYNC_LABEL.SHOWING_USERS(filteredByVerified.length, pagination.total)}
                </span>
                {searchInput?.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    Search: {searchInput.trim()}
                  </span>
                )}
                {roleFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    Role: {USER_ROLE_OPTIONS.find((o: UserRoleOption) => o.value === roleFilter)?.label ?? roleFilter}
                  </span>
                )}
                {verifiedFilter !== USER_VERIFIED_FILTER.ALL && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    Status:{" "}
                    {verifiedFilter === USER_VERIFIED_FILTER.VERIFIED ? SYNC_LABEL.VERIFIED : SYNC_LABEL.UNVERIFIED}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table / Cards */}
      <Card className={DASHBOARD_LAYOUT.TABLE_CARD_CLASS}>
        <CardHeader className={DASHBOARD_LAYOUT.TABLE_CARD_HEADER_CLASS}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={DASHBOARD_LAYOUT.TABLE_CARD_TITLE_CLASS}>{SYNC_LABEL.ALL_USERS}</CardTitle>
              <CardDescription>
                {filteredByVerified.length === 0
                  ? SYNC_LABEL.NO_USERS_FOUND
                  : SYNC_LABEL.SHOWING_USERS(filteredByVerified.length, pagination.total)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className={DASHBOARD_LAYOUT.TABLE_CARD_CONTENT_CLASS}>
          {loading && users.length > 0 ? (
            <div className="px-4 py-3 sm:px-5">
              <UsersTableSkeleton />
            </div>
          ) : (
            <DataTable<User>
              embedded
              columns={userColumns}
              rows={visibleRows}
              getRowId={(row) => row._id}
              renderRow={(row) => <UserTableRow user={row} onEdit={handleEdit} onDelete={handleDeleteClick} />}
              mobileRow={(row) => <UserCard user={row} onEdit={handleEdit} onDelete={handleDeleteClick} />}
              pageSize={{
                value: pageLimit,
                onChange: (limit) => {
                  setPageLimit(limit);
                  setPage(1);
                },
              }}
              sort={{
                key: sort.key,
                direction: sort.direction,
                onChange: setSort,
              }}
              loading={loading}
              empty={
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                    <FiUser className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{SYNC_LABEL.NO_USERS_FOUND}</h3>
                  <p className="mx-auto mb-6 max-w-sm text-muted-foreground">{SYNC_LABEL.NO_USERS_FOUND_DESCRIPTION}</p>
                  {hasActiveFilters ? (
                    <Button variant="outline" onClick={clearAllFilters}>
                      {SYNC_LABEL.CLEAR_ALL_FILTERS}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={fetchUsers}>
                      <FiRefreshCw className="mr-2 h-4 w-4" />
                      {SYNC_LABEL.RETRY}
                    </Button>
                  )}
                </div>
              }
              pagination={{
                page: pagination.page,
                pages: Math.max(1, pagination.pages || 1),
                onPrev: () => setPage((p) => Math.max(1, p - 1)),
                onNext: () => setPage((p) => Math.min(Math.max(1, pagination.pages || 1), p + 1)),
                onPageChange: (nextPage) => {
                  setPage(nextPage);
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={SYNC_LABEL.ADD_NEW_USER}
        description={SYNC_LABEL.CREATE_NEW_USER_ACCOUNT}
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={creating}>
              {SYNC_LABEL.CANCEL}
            </Button>
            <Button onClick={handleAddUser} disabled={creating || !addForm.username?.trim() || !addForm.email?.trim()}>
              {creating ? SYNC_LABEL.CREATING : SYNC_LABEL.CREATE_USER}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {SYNC_LABEL.LABEL_USERNAME}{" "}
                <span className={COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}>{SYNC_LABEL.REQUIRED_FIELD}</span>
              </label>
              <Input
                value={addForm.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAddForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder={SYNC_LABEL.PLACEHOLDER_USERNAME}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {SYNC_LABEL.EMAIL_LABEL}{" "}
                <span className={COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}>{SYNC_LABEL.REQUIRED_FIELD}</span>
              </label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder={SYNC_LABEL.PLACEHOLDER_EMAIL}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {SYNC_LABEL.LABEL_PASSWORD}{" "}
              <span className="text-muted-foreground text-xs">{SYNC_LABEL.PASSWORD_OPTIONAL}</span>
            </label>
            <Input
              type="password"
              value={addForm.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAddForm((f) => ({ ...f, password: e.target.value }))
              }
              placeholder={SYNC_LABEL.PLACEHOLDER_PASSWORD}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_FIRST_NAME}</label>
              <Input
                value={addForm.firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAddForm((f) => ({ ...f, firstName: e.target.value }))
                }
                placeholder={SYNC_LABEL.PLACEHOLDER_FIRST_NAME}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_LAST_NAME}</label>
              <Input
                value={addForm.lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAddForm((f) => ({ ...f, lastName: e.target.value }))
                }
                placeholder={SYNC_LABEL.PLACEHOLDER_LAST_NAME}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_BIO}</label>
            <Textarea
              value={addForm.bio}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setAddForm((f) => ({ ...f, bio: e.target.value }))
              }
              placeholder={SYNC_LABEL.PLACEHOLDER_BIO}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_AVATAR_URL}</label>
            <Input
              type="url"
              value={addForm.avatar}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAddForm((f) => ({ ...f, avatar: e.target.value }))
              }
              placeholder={SYNC_LABEL.PLACEHOLDER_AVATAR_URL}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="add-user-role">
                {SYNC_LABEL.LABEL_ROLE}
              </label>
              <Select
                id="add-user-role"
                value={addForm.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setAddForm((f) => ({ ...f, role: e.target.value }))
                }
                options={USER_ROLE_OPTIONS.map((opt: UserRoleOption) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.isVerified}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAddForm((f) => ({ ...f, isVerified: e.target.checked }))
                  }
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">{SYNC_LABEL.LABEL_VERIFIED}</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={SYNC_LABEL.EDIT_USER}
        description={
          editingUser
            ? SYNC_LABEL.EDITING_USER(
                editingUser.firstName && editingUser.lastName
                  ? `${editingUser.firstName} ${editingUser.lastName}`
                  : editingUser.username,
              )
            : ""
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={updating}>
              {SYNC_LABEL.CANCEL}
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? SYNC_LABEL.UPDATING : SYNC_LABEL.SAVE_CHANGES}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="edit-user-role">
              {SYNC_LABEL.LABEL_ROLE}
            </label>
            <Select
              id="edit-user-role"
              value={editForm.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEditForm((f) => ({ ...f, role: e.target.value }))
              }
              options={USER_ROLE_OPTIONS.map((opt: UserRoleOption) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isVerified}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditForm((f) => ({ ...f, isVerified: e.target.checked }))
                }
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{SYNC_LABEL.LABEL_VERIFIED}</span>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, username: "" })}
        onConfirm={handleDeleteConfirm}
        title={SYNC_LABEL.DELETE_USER}
        message={SYNC_LABEL.DELETE_USER_CONFIRM(deleteConfirm.username)}
        confirmText={SYNC_LABEL.DELETE}
        cancelText={SYNC_LABEL.CANCEL}
        variant={BUTTON_VARIANTS.DESTRUCTIVE}
        isLoading={deleting}
        size="md"
      />
    </div>
  );
};

export default Users;
