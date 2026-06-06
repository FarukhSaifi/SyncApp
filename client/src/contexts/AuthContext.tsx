import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { STORAGE_KEYS, SYNC_LABEL, TOAST_TITLES } from "@constants";
import { clearPostsCache } from "@hooks/usePosts";
import { useToast } from "@hooks/useToast";
import type { AuthContextValue, AuthResult, User } from "@types";
import { apiClient } from "@utils/apiClient";
import { logError } from "@utils/logger";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;

function resolveAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isNetworkFailureMessage(message: string): boolean {
  return /network error|unable to connect|timeout/i.test(message);
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearPostsCache();
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
    toast.info(TOAST_TITLES.LOGGED_OUT, SYNC_LABEL.LOGGED_OUT_SUCCESS);
  }, [toast]);

  const fetchUserProfile = useCallback(
    async (tokenToUse?: string) => {
      const authToken = tokenToUse ?? token;
      if (!authToken) {
        setLoading(false);
        return;
      }
      if (typeof window !== "undefined" && tokenToUse) {
        localStorage.setItem(TOKEN_KEY, tokenToUse);
      }

      try {
        const data = await apiClient.getMe();

        if (data.success) {
          setUser(data.data as User);
        } else {
          // Token is invalid, remove it
          toast.authError(SYNC_LABEL.SESSION_EXPIRED);
          logout();
        }
      } catch (error) {
        logError("Error fetching user profile", error);
        toast.networkError();
        logout();
      } finally {
        setLoading(false);
      }
    },
    [token, toast, logout],
  );

  useEffect(() => {
    const stored = getStoredToken();
    setToken(stored);
    if (stored) {
      fetchUserProfile(stored);
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const data = await apiClient.login({ email, password });

      if (data.success && data.data) {
        const { user: userData, token: authToken } = data.data;
        setUser(userData);
        setToken(authToken);
        if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, authToken);
        toast.success(TOAST_TITLES.WELCOME_BACK, SYNC_LABEL.WELCOME_MESSAGE(userData.firstName || userData.username));
        return { success: true };
      } else {
        toast.authError(data.error || SYNC_LABEL.INVALID_CREDENTIALS);
        return { success: false, error: data.error };
      }
    } catch (error) {
      logError("Login error", error);
      const message = resolveAuthErrorMessage(error, SYNC_LABEL.LOGIN_FAILED);
      if (isNetworkFailureMessage(message)) {
        toast.networkError();
      } else {
        toast.authError(message);
      }
      return { success: false, error: message };
    }
  };

  const register = async (userData: Record<string, unknown>): Promise<AuthResult> => {
    try {
      const data = await apiClient.register(userData);

      if (data.success && data.data) {
        const { user: newUser, token: authToken } = data.data;
        setUser(newUser);
        setToken(authToken);
        if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, authToken);
        toast.success(
          TOAST_TITLES.WELCOME,
          SYNC_LABEL.ACCOUNT_CREATED_SUCCESS?.(newUser.firstName || newUser.username) ?? "",
        );
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.REGISTRATION_FAILED, data.error || SYNC_LABEL.REGISTRATION_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      logError("Registration error", error);
      const message = resolveAuthErrorMessage(error, SYNC_LABEL.REGISTRATION_FAILED_RETRY);
      if (isNetworkFailureMessage(message)) {
        toast.networkError();
      } else {
        toast.error(TOAST_TITLES.REGISTRATION_FAILED, message);
      }
      return { success: false, error: message };
    }
  };

  const updateProfile = async (profileData: Record<string, unknown>): Promise<AuthResult> => {
    try {
      const data = await apiClient.updateProfile(profileData);

      if (data.success && data.data) {
        setUser(data.data as User);
        toast.success(TOAST_TITLES.PROFILE_UPDATED, SYNC_LABEL.PROFILE_UPDATED_SUCCESS);
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.UPDATE_FAILED, data.error || SYNC_LABEL.PROFILE_UPDATE_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      logError("Profile update error", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.PROFILE_UPDATE_FAILED_RETRY };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      const data = await apiClient.changePassword({ currentPassword, newPassword });

      if (data.success) {
        toast.success(TOAST_TITLES.PASSWORD_CHANGED, SYNC_LABEL.PASSWORD_CHANGED_SUCCESS);
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.PASSWORD_CHANGE_FAILED, data.error || SYNC_LABEL.PASSWORD_CHANGE_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      logError("Password change error", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.PASSWORD_CHANGE_FAILED_RETRY };
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
