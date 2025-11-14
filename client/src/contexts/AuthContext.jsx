import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, HTTP_METHODS, SYNC_LABEL, TOAST_TITLES } from "../constants";
import { useToast } from "../hooks/useToast";
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not when token changes

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        // Token is invalid, remove it
        toast.authError(SYNC_LABEL.SESSION_EXPIRED);
        logout();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.networkError();
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: HTTP_METHODS.POST,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token: authToken } = data.data;
        setUser(userData);
        setToken(authToken);
        localStorage.setItem("token", authToken);
        toast.success(TOAST_TITLES.WELCOME_BACK, SYNC_LABEL.WELCOME_MESSAGE(userData.firstName || userData.username));
        return { success: true };
      } else {
        toast.authError(data.error || SYNC_LABEL.INVALID_CREDENTIALS);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.LOGIN_FAILED };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: HTTP_METHODS.POST,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        const { user: newUser, token: authToken } = data.data;
        setUser(newUser);
        setToken(authToken);
        localStorage.setItem("token", authToken);
        toast.success(TOAST_TITLES.WELCOME, SYNC_LABEL.ACCOUNT_CREATED_SUCCESS(newUser.firstName || newUser.username));
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.REGISTRATION_FAILED, data.error || SYNC_LABEL.REGISTRATION_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.REGISTRATION_FAILED_RETRY };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    toast.info(TOAST_TITLES.LOGGED_OUT, SYNC_LABEL.LOGGED_OUT_SUCCESS);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: HTTP_METHODS.PUT,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        toast.success(TOAST_TITLES.PROFILE_UPDATED, SYNC_LABEL.PROFILE_UPDATED_SUCCESS);
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.UPDATE_FAILED, data.error || SYNC_LABEL.PROFILE_UPDATE_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.PROFILE_UPDATE_FAILED_RETRY };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: HTTP_METHODS.PUT,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(TOAST_TITLES.PASSWORD_CHANGED, SYNC_LABEL.PASSWORD_CHANGED_SUCCESS);
        return { success: true };
      } else {
        toast.error(TOAST_TITLES.PASSWORD_CHANGE_FAILED, data.error || SYNC_LABEL.PASSWORD_CHANGE_FAILED);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.networkError();
      return { success: false, error: SYNC_LABEL.PASSWORD_CHANGE_FAILED_RETRY };
    }
  };

  const value = {
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
