import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCw, FiSearch, FiUser, FiX } from "react-icons/fi";

import Button from "@components/common/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/common/Card";
import ConfirmationModal from "@components/common/ConfirmationModal";
import Input from "@components/common/Input";
import Modal from "@components/common/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/common/Table";
import Textarea from "@components/common/Textarea";
import UserCard from "@components/users/UserCard";
import UserTableRow from "@components/users/UserTableRow";

import { useDebounce } from "@hooks/useDebounce";
import { useToast } from "@hooks/useToast";

import { apiClient } from "@utils/apiClient";
import { logError } from "@utils/logger";

import {
  APP_CONFIG,
  BUTTON_VARIANTS,
  COLOR_CLASSES,
  ERROR_MESSAGES,
  PLACEHOLDERS,
  SUCCESS_MESSAGES,
  SYNC_LABEL,
  TOAST_TITLES,
  USER_ROLES,
  USER_ROLE_OPTIONS,
  type UserRoleOption,
} from "@constants";
import type { User } from "@types";

const VERIFIED_FILTER_ALL = "all";
const VERIFIED_FILTER_VERIFIED = "verified";
const VERIFIED_FILTER_UNVERIFIED = "unverified";

interface AddUserForm extends Record<string, unknown> {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  role: string;
  isVerified: boolean;
}

interface EditForm extends Record<string, unknown> {
  role: string;
  isVerified: boolean;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface DeleteConfirmState {
  isOpen: boolean;
  userId: string | null;
  username: string;
}

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

function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{SYNC_LABEL.TABLE_USER}</TableHead>
          <TableHead>{SYNC_LABEL.TABLE_EMAIL}</TableHead>
          <TableHead>{SYNC_LABEL.TABLE_ROLE}</TableHead>
          <TableHead>{SYNC_LABEL.TABLE_STATUS}</TableHead>
          <TableHead>{SYNC_LABEL.TABLE_JOINED}</TableHead>
          <TableHead>{SYNC_LABEL.TABLE_LAST_LOGIN}</TableHead>
          <TableHead className="text-right">{SYNC_LABEL.TABLE_ACTIONS}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 7 }).map((_, j) => (
              <TableCell key={j}>
                <div className="h-5 bg-muted/60 rounded animate-pulse" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
  const [verifiedFilter, setVerifiedFilter] = useState<string>(VERIFIED_FILTER_ALL);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: APP_CONFIG.DEFAULT_LIMIT,
    total: 0,
    pages: 1,
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ role: "", isVerified: false });
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<AddUserForm>(initialAddForm);
  const [creating, setCreating] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, userId: null, username: "" });
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {
        page,
        limit: APP_CONFIG.DEFAULT_LIMIT,
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
            limit: APP_CONFIG.DEFAULT_LIMIT,
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
  }, [page, debouncedSearch, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredByVerified = useMemo(() => {
    if (verifiedFilter === VERIFIED_FILTER_ALL) return users;
    if (verifiedFilter === VERIFIED_FILTER_VERIFIED) return users.filter((u) => u.isVerified);
    return users.filter((u) => !u.isVerified);
  }, [users, verifiedFilter]);

  const hasActiveFilters = Boolean(searchInput?.trim() || roleFilter || verifiedFilter !== VERIFIED_FILTER_ALL);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    setRoleFilter("");
    setVerifiedFilter(VERIFIED_FILTER_ALL);
    setPage(1);
  }, []);

  const handleDeleteClick = useCallback((userId: string, username: string) => {
    setDeleteConfirm({ isOpen: true, userId, username });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.userId) return;
    setDeleting(true);
    try {
      const response = await apiClient.deleteUser(deleteConfirm.userId);
      if (response?.success) {
        toast.success(TOAST_TITLES.USER_DELETED, SUCCESS_MESSAGES.USER_DELETED(deleteConfirm.username));
        setDeleteConfirm({ isOpen: false, userId: null, username: "" });
        fetchUsers();
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_DELETE_USER);
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
    if (!editingUser) return;
    try {
      const response = await apiClient.updateUser(editingUser._id, editForm);
      if (response?.success) {
        toast.success(TOAST_TITLES.USER_UPDATED, SUCCESS_MESSAGES.USER_UPDATED);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_UPDATE_USER);
      }
    } catch (err) {
      logError("Error updating user", err);
      toast.apiError((err as Error)?.message || SYNC_LABEL.FAILED_TO_UPDATE_USER);
    }
  }, [editingUser, editForm, toast, fetchUsers]);

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

  const formatDate = useCallback((dateString: string | undefined): string => {
    if (!dateString) return PLACEHOLDERS.N_A;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

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
                <select
                  value={roleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-40 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  aria-label={SYNC_LABEL.TABLE_ROLE}
                >
                  <option value="">{PLACEHOLDERS.ALL_ROLES}</option>
                  {USER_ROLE_OPTIONS.map((opt: UserRoleOption) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={verifiedFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVerifiedFilter(e.target.value)}
                  className="w-full sm:w-36 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  aria-label={SYNC_LABEL.TABLE_STATUS}
                >
                  <option value={VERIFIED_FILTER_ALL}>{SYNC_LABEL.FILTER_ALL}</option>
                  <option value={VERIFIED_FILTER_VERIFIED}>{SYNC_LABEL.VERIFIED}</option>
                  <option value={VERIFIED_FILTER_UNVERIFIED}>{SYNC_LABEL.UNVERIFIED}</option>
                </select>
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
                {verifiedFilter !== VERIFIED_FILTER_ALL && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    Status: {verifiedFilter === VERIFIED_FILTER_VERIFIED ? SYNC_LABEL.VERIFIED : SYNC_LABEL.UNVERIFIED}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table / Cards */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{SYNC_LABEL.ALL_USERS}</CardTitle>
              <CardDescription>
                {filteredByVerified.length === 0
                  ? SYNC_LABEL.NO_USERS_FOUND
                  : SYNC_LABEL.SHOWING_USERS(filteredByVerified.length, pagination.total)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length > 0 ? (
            <UsersTableSkeleton />
          ) : filteredByVerified.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <FiUser className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{SYNC_LABEL.NO_USERS_FOUND}</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">{SYNC_LABEL.NO_USERS_FOUND_DESCRIPTION}</p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearAllFilters}>
                  {SYNC_LABEL.CLEAR_ALL_FILTERS}
                </Button>
              ) : (
                <Button variant="outline" onClick={fetchUsers}>
                  <FiRefreshCw className="h-4 w-4 mr-2" />
                  {SYNC_LABEL.RETRY}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {filteredByVerified.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    formatDate={formatDate}
                  />
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{SYNC_LABEL.TABLE_USER}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_EMAIL}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_ROLE}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_STATUS}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_JOINED}</TableHead>
                      <TableHead>{SYNC_LABEL.TABLE_LAST_LOGIN}</TableHead>
                      <TableHead className="text-right">{SYNC_LABEL.TABLE_ACTIONS}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredByVerified.map((user) => (
                      <UserTableRow
                        key={user._id}
                        user={user}
                        formatDate={formatDate}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {SYNC_LABEL.PAGE_OF(pagination.page, pagination.pages)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1 || loading}
                    >
                      {SYNC_LABEL.PREVIOUS}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page >= pagination.pages || loading}
                    >
                      {SYNC_LABEL.NEXT}
                    </Button>
                  </div>
                </div>
              )}
            </>
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
              <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_ROLE}</label>
              <select
                value={addForm.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setAddForm((f) => ({ ...f, role: e.target.value }))
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {USER_ROLE_OPTIONS.map((opt: UserRoleOption) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {SYNC_LABEL.CANCEL}
            </Button>
            <Button onClick={handleUpdate}>{SYNC_LABEL.SAVE_CHANGES}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{SYNC_LABEL.LABEL_ROLE}</label>
            <select
              value={editForm.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEditForm((f) => ({ ...f, role: e.target.value }))
              }
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {USER_ROLE_OPTIONS.map((opt: UserRoleOption) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
