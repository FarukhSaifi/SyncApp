import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ERRORS, LABELS, ROUTES, TOAST } from "@/src/constants";
import { toast } from "@/src/hooks/useToast";
import { apiClient, setUnauthorizedHandler } from "@/src/services/apiClient";
import { clearToken, getToken, setToken } from "@/src/services/tokenStorage";
import type { AuthContextValue, AuthResult, User } from "@/src/types";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    setUser(null);
    setTokenState(null);
    await clearToken();
    router.replace(ROUTES.LOGIN);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      toast.error(LABELS.SESSION_EXPIRED);
      void logout();
    });
  }, [logout]);

  const fetchUserProfile = useCallback(
    async (authToken: string) => {
      try {
        const data = await apiClient.getMe();
        if (data.success && data.data) {
          setUser(data.data);
          setTokenState(authToken);
        } else {
          await logout();
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    },
    [logout],
  );

  useEffect(() => {
    void (async () => {
      const stored = await getToken();
      if (stored) {
        await fetchUserProfile(stored);
      } else {
        setLoading(false);
      }
    })();
  }, [fetchUserProfile]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const data = await apiClient.login({ email, password });
      if (data.success && data.data) {
        const { user: userData, token: authToken } = data.data;
        await setToken(authToken);
        setUser(userData);
        setTokenState(authToken);
        toast.success(LABELS.WELCOME_BACK);
        return { success: true };
      }
      toast.error(data.error ?? ERRORS.LOGIN_FAILED);
      return { success: false, error: data.error };
    } catch (e) {
      toast.error((e as Error).message);
      return { success: false, error: (e as Error).message };
    }
  };

  const register = async (userData: Record<string, unknown>): Promise<AuthResult> => {
    try {
      const data = await apiClient.register(userData);
      if (data.success && data.data) {
        const { user: newUser, token: authToken } = data.data;
        await setToken(authToken);
        setUser(newUser);
        setTokenState(authToken);
        toast.success(LABELS.REGISTRATION_SUCCESS);
        return { success: true };
      }
      toast.error(data.error ?? ERRORS.REGISTRATION_FAILED);
      return { success: false, error: data.error };
    } catch (e) {
      toast.error((e as Error).message);
      return { success: false, error: (e as Error).message };
    }
  };

  const updateProfile = async (profileData: Record<string, unknown>): Promise<AuthResult> => {
    try {
      const data = await apiClient.updateProfile(profileData);
      if (data.success && data.data) {
        setUser(data.data);
        toast.success(TOAST.PROFILE_UPDATED);
        return { success: true };
      }
      toast.error(data.error ?? ERRORS.UPDATE_FAILED);
      return { success: false, error: data.error };
    } catch (e) {
      toast.error((e as Error).message);
      return { success: false, error: (e as Error).message };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      const data = await apiClient.changePassword({ currentPassword, newPassword });
      if (data.success) {
        toast.success(TOAST.PASSWORD_CHANGED);
        return { success: true };
      }
      toast.error(data.error ?? ERRORS.PASSWORD_CHANGE_FAILED);
      return { success: false, error: data.error };
    } catch (e) {
      toast.error((e as Error).message);
      return { success: false, error: (e as Error).message };
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
}
