import React, { useCallback, useEffect, useState } from "react";
import { FiEdit3, FiPlus, FiRefreshCw, FiSearch, FiShield, FiTrash2, FiUser, FiUserCheck } from "react-icons/fi";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import Textarea from "../components/ui/Textarea";
import UserCard from "../components/users/UserCard";
import {
  COLOR_CLASSES,
  PLACEHOLDERS,
  SUCCESS_MESSAGES,
  SYNC_LABEL,
  TOAST_TITLES,
  USER_ROLES,
  USER_ROLE_OPTIONS,
} from "../constants";
import { useToast } from "../hooks/useToast";
import { apiClient } from "../utils/apiClient";
import { logError } from "../utils/logger";

const Users = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", isVerified: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    bio: "",
    avatar: "",
    role: USER_ROLES.USER,
    isVerified: false,
  });
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    userId: null,
    username: "",
  });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      };
      const response = await apiClient.getUsers(params);
      if (response?.success) {
        setUsers(response.users || []);
        setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      } else {
        setError(response?.error || SYNC_LABEL.FAILED_TO_LOAD_USERS);
      }
    } catch (err) {
      logError("Error fetching users", err);
      setError(err.message || SYNC_LABEL.FAILED_TO_LOAD_USERS);
      toast.apiError(err.message || SYNC_LABEL.FAILED_TO_LOAD_USERS);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteClick = useCallback((userId, username) => {
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
      toast.apiError(err.message || SYNC_LABEL.FAILED_TO_DELETE_USER);
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, toast, fetchUsers]);

  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || USER_ROLES.USER,
      isVerified: user.isVerified || false,
    });
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!editingUser) return;

    try {
      const response = await apiClient.updateUser(editingUser._id || editingUser.id, editForm);
      if (response?.success) {
        toast.success(TOAST_TITLES.USER_UPDATED, SUCCESS_MESSAGES.USER_UPDATED);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_UPDATE_USER);
      }
    } catch (err) {
      logError("Error updating user", err);
      toast.apiError(err.message || SYNC_LABEL.FAILED_TO_UPDATE_USER);
    }
  }, [editingUser, editForm, toast, fetchUsers]);

  const handleAddUser = useCallback(async () => {
    if (!addForm.username || !addForm.email) {
      toast.validationError(SYNC_LABEL.USERNAME_EMAIL_REQUIRED);
      return;
    }

    setCreating(true);
    try {
      const response = await apiClient.createUser(addForm);
      if (response?.success) {
        toast.success(TOAST_TITLES.USER_CREATED, SUCCESS_MESSAGES.USER_CREATED(response.data.username));
        setShowAddModal(false);
        setAddForm({
          username: "",
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          bio: "",
          avatar: "",
          role: USER_ROLES.USER,
          isVerified: false,
        });
        fetchUsers();
      } else {
        toast.apiError(response?.error || SYNC_LABEL.FAILED_TO_CREATE_USER);
      }
    } catch (err) {
      logError("Error creating user", err);
      toast.apiError(err.message || SYNC_LABEL.FAILED_TO_CREATE_USER);
    } finally {
      setCreating(false);
    }
  }, [addForm, toast, fetchUsers]);

  const formatDate = (dateString) => {
    if (!dateString) return PLACEHOLDERS.N_A;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <FiRefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs sm:text-sm">{SYNC_LABEL.REFRESH}</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-1.5 sm:space-x-2">
            <FiPlus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">{SYNC_LABEL.ADD_USER}</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className={`${COLOR_CLASSES.ALERT_BG.DESTRUCTIVE} ${COLOR_CLASSES.ALERT_TEXT.DESTRUCTIVE} px-4 py-3 rounded-md`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{SYNC_LABEL.FAILED_TO_LOAD_USERS}</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <FiRefreshCw className="h-4 w-4 mr-1" />
              {SYNC_LABEL.RETRY}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={SYNC_LABEL.PLACEHOLDER_SEARCH_USERS}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{PLACEHOLDERS.ALL_ROLES}</option>
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{SYNC_LABEL.ALL_USERS}</CardTitle>
              <CardDescription>
                {users.length === 0
                  ? SYNC_LABEL.NO_USERS_FOUND
                  : SYNC_LABEL.SHOWING_USERS(users.length, pagination.total)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <FiUser className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{SYNC_LABEL.NO_USERS_FOUND}</h3>
              <p className="text-muted-foreground">{SYNC_LABEL.NO_USERS_FOUND_DESCRIPTION}</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <UserCard
                    key={user._id || user.id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    formatDate={formatDate}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
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
                    {users.map((user) => (
                      <TableRow key={user._id || user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.username || "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === USER_ROLES.ADMIN
                                ? "bg-purple-100 text-purple-800"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role === USER_ROLES.ADMIN ? (
                              <>
                                <FiShield className="h-3 w-3 mr-1" />
                                {USER_ROLE_OPTIONS.find((opt) => opt.value === USER_ROLES.ADMIN)?.label}
                              </>
                            ) : (
                              <>
                                <FiUser className="h-3 w-3 mr-1" />
                                {USER_ROLE_OPTIONS.find((opt) => opt.value === USER_ROLES.USER)?.label}
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isVerified ? COLOR_CLASSES.BADGE.VERIFIED : COLOR_CLASSES.BADGE.UNVERIFIED
                            }`}
                          >
                            {user.isVerified ? (
                              <>
                                <FiUserCheck className="h-3 w-3 mr-1" />
                                {SYNC_LABEL.VERIFIED}
                              </>
                            ) : (
                              SYNC_LABEL.UNVERIFIED
                            )}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="flex items-center space-x-1"
                            >
                              <FiEdit3 className="h-4 w-4" />
                              <span>{SYNC_LABEL.EDIT}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(user._id || user.id, user.username)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <FiTrash2 className="h-4 w-4" />
                              <span>{SYNC_LABEL.DELETE}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {SYNC_LABEL.PAGE_OF(pagination.page, pagination.pages)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1 || loading}
                    >
                      {SYNC_LABEL.PREVIOUS}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page === pagination.pages || loading}
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
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={creating}>
              {SYNC_LABEL.CANCEL}
            </Button>
            <Button onClick={handleAddUser} disabled={creating || !addForm.username || !addForm.email}>
              {creating ? SYNC_LABEL.CREATING : SYNC_LABEL.CREATE_USER}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                {SYNC_LABEL.LABEL_USERNAME}{" "}
                <span className={COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}>{SYNC_LABEL.REQUIRED_FIELD}</span>
              </label>
              <Input
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                placeholder={SYNC_LABEL.PLACEHOLDER_USERNAME}
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                {SYNC_LABEL.LABEL_EMAIL}{" "}
                <span className={COLOR_CLASSES.ICON_COLOR.DESTRUCTIVE}>{SYNC_LABEL.REQUIRED_FIELD}</span>
              </label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder={SYNC_LABEL.PLACEHOLDER_EMAIL}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
              {SYNC_LABEL.LABEL_PASSWORD}{" "}
              <span className="text-muted-foreground text-xs">{SYNC_LABEL.PASSWORD_OPTIONAL}</span>
            </label>
            <Input
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder={SYNC_LABEL.PLACEHOLDER_PASSWORD}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                {SYNC_LABEL.LABEL_FIRST_NAME}
              </label>
              <Input
                value={addForm.firstName}
                onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                placeholder={SYNC_LABEL.PLACEHOLDER_FIRST_NAME}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                {SYNC_LABEL.LABEL_LAST_NAME}
              </label>
              <Input
                value={addForm.lastName}
                onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                placeholder={SYNC_LABEL.PLACEHOLDER_LAST_NAME}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{SYNC_LABEL.LABEL_BIO}</label>
            <Textarea
              value={addForm.bio}
              onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
              placeholder={SYNC_LABEL.PLACEHOLDER_BIO}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{SYNC_LABEL.LABEL_AVATAR_URL}</label>
            <Input
              type="url"
              value={addForm.avatar}
              onChange={(e) => setAddForm({ ...addForm, avatar: e.target.value })}
              placeholder={SYNC_LABEL.PLACEHOLDER_AVATAR_URL}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{SYNC_LABEL.LABEL_ROLE}</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.isVerified}
                  onChange={(e) => setAddForm({ ...addForm, isVerified: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs sm:text-sm font-medium">{SYNC_LABEL.LABEL_VERIFIED}</span>
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
                  : editingUser.username
              )
            : ""
        }
        size="md"
        footer={
          <div className="flex items-center justify-end space-x-2 pt-4">
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
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editForm.isVerified}
                onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{SYNC_LABEL.LABEL_VERIFIED}</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, username: "" })}
        onConfirm={handleDeleteConfirm}
        title={SYNC_LABEL.DELETE_USER}
        message={SYNC_LABEL.DELETE_USER_CONFIRM(deleteConfirm.username)}
        confirmText={SYNC_LABEL.DELETE}
        cancelText={SYNC_LABEL.CANCEL}
        variant="destructive"
        isLoading={deleting}
        size="md"
      />
    </div>
  );
};

export default Users;
