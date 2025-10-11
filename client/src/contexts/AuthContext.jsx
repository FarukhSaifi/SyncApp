import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE } from "../constants";
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
  }, [token]);

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
        toast.authError("Session expired. Please log in again.");
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
        method: "POST",
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
        toast.success("Welcome back!", `Hello ${userData.firstName || userData.username}!`);
        return { success: true };
      } else {
        toast.authError(data.error || "Invalid credentials");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.networkError();
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
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
        toast.success("Welcome to SyncApp!", `Account created successfully for ${newUser.firstName || newUser.username}!`);
        return { success: true };
      } else {
        toast.error("Registration Failed", data.error || "Failed to create account");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.networkError();
      return { success: false, error: "Registration failed. Please try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    toast.info("Logged out", "You have been successfully logged out");
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        toast.success("Profile Updated", "Your profile has been updated successfully");
        return { success: true };
      } else {
        toast.error("Update Failed", data.error || "Failed to update profile");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.networkError();
      return { success: false, error: "Profile update failed. Please try again." };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Password Changed", "Your password has been updated successfully");
        return { success: true };
      } else {
        toast.error("Password Change Failed", data.error || "Failed to change password");
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.networkError();
      return { success: false, error: "Password change failed. Please try again." };
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
