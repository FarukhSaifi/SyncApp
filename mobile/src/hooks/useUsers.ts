import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { ALERTS, APP_CONFIG, ERRORS, LABELS, ROUTES, TOAST } from "@/src/constants";
import { USER_ROLES, USER_VERIFIED_FILTER } from "@/src/constants/userRoles";
import { useDebounce } from "@/src/hooks/useDebounce";
import { toast } from "@/src/hooks/useToast";
import { apiClient } from "@/src/services/apiClient";
import type { User } from "@/src/types";

interface UseUsersOptions {
  userRole?: string;
}

export interface AddUserForm {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

export interface EditUserForm {
  role: string;
  isVerified: boolean;
}

const initialAddForm: AddUserForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: USER_ROLES.USER,
  isVerified: false,
};

export function useUsers({ userRole }: UseUsersOptions) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>(USER_VERIFIED_FILTER.ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>(initialAddForm);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ role: USER_ROLES.USER, isVerified: false });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.getUsers({
        page,
        limit: APP_CONFIG.DEFAULT_LIMIT,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(roleFilter && { role: roleFilter }),
      });
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        setTotalPages(res.pagination?.pages ?? 1);
      } else {
        toast.error(res.error ?? ERRORS.FAILED_TO_LOAD_USERS);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    if (userRole !== USER_ROLES.ADMIN) {
      toast.error(LABELS.ADMIN_ONLY);
      router.replace(ROUTES.SETTINGS);
      return;
    }
    setLoading(true);
    void fetchUsers();
  }, [userRole, fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (verifiedFilter === USER_VERIFIED_FILTER.ALL) return users;
    if (verifiedFilter === USER_VERIFIED_FILTER.VERIFIED) return users.filter((u) => u.isVerified);
    return users.filter((u) => !u.isVerified);
  }, [users, verifiedFilter]);

  const hasActiveFilters = Boolean(searchInput.trim() || roleFilter || verifiedFilter !== USER_VERIFIED_FILTER.ALL);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setRoleFilter("");
    setVerifiedFilter(USER_VERIFIED_FILTER.ALL);
    setPage(1);
  }, []);

  const confirmDelete = useCallback((u: User) => {
    const id = u._id || u.id!;
    Alert.alert(ALERTS.DELETE_USER_TITLE, u.username, [
      { text: LABELS.CANCEL, style: "cancel" },
      {
        text: LABELS.DELETE,
        style: "destructive",
        onPress: async () => {
          const res = await apiClient.deleteUser(id);
          if (res.success) {
            setUsers((prev) => prev.filter((x) => (x._id || x.id) !== id));
            toast.success(TOAST.USER_DELETED);
          } else {
            toast.error(res.error ?? ERRORS.DELETE_FAILED);
          }
        },
      },
    ]);
  }, []);

  const openEdit = useCallback((u: User) => {
    setEditingUser(u);
    setEditForm({ role: u.role || USER_ROLES.USER, isVerified: u.isVerified ?? false });
  }, []);

  const closeEdit = useCallback(() => setEditingUser(null), []);

  const updateUser = useCallback(async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      const id = editingUser._id || editingUser.id!;
      const res = await apiClient.updateUser(id, { ...editForm });
      if (res.success) {
        toast.success(TOAST.USER_UPDATED);
        setEditingUser(null);
        void fetchUsers();
      } else {
        toast.error(res.error ?? ERRORS.UPDATE_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUpdating(false);
    }
  }, [editingUser, editForm, fetchUsers]);

  const createUser = useCallback(async () => {
    if (!addForm.username.trim() || !addForm.email.trim()) {
      toast.error(LABELS.USERNAME_EMAIL_REQUIRED);
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient.createUser({ ...addForm });
      if (res.success) {
        toast.success(TOAST.USER_CREATED);
        setShowAddModal(false);
        setAddForm(initialAddForm);
        void fetchUsers();
      } else {
        toast.error(res.error ?? ERRORS.SAVE_FAILED);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }, [addForm, fetchUsers]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users: filteredUsers,
    searchInput,
    setSearchInput,
    roleFilter,
    setRoleFilter,
    verifiedFilter,
    setVerifiedFilter,
    page,
    setPage,
    totalPages,
    loading,
    refreshing,
    creating,
    updating,
    showAddModal,
    setShowAddModal,
    addForm,
    setAddForm,
    editingUser,
    editForm,
    setEditForm,
    fetchUsers,
    confirmDelete,
    openEdit,
    closeEdit,
    updateUser,
    createUser,
    refresh,
    clearFilters,
    hasActiveFilters,
    isAdmin: userRole === USER_ROLES.ADMIN,
  };
}
