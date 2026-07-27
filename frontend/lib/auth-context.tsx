"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/modules/auth/types";
import { useRouter } from "next/navigation";
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  getMeRequest,
} from "@/modules/auth/actions";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  useEffect(() => {
    async function checkAuth() {
      const hasSession = getCookie("has_session");
      if (hasSession === "true") {
        try {
          const userData = await getMeRequest();
          setUser(userData);
        } catch {
          // If we fail here, the interceptor would attempt token refreshing.
          // If it still fails, it clears state.
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      setUser(data.user);

      if (typeof document !== "undefined") {
        document.cookie = `has_session=true; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
        document.cookie = `role=${data.user.role}; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
      }

      // Redirect based on role
      if (data.user.role === "admin" || data.user.role === "instructor") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // 1. Register student (automatically role STUDENT)
      await registerRequest(name, email, password);

      // 2. Automatically log in after registration
      const data = await loginRequest(email, password);
      setUser(data.user);

      // Set helper cookies client-side for Next.js middleware (to support cross-domain)
      if (typeof document !== "undefined") {
        document.cookie = `has_session=true; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
        document.cookie = `role=${data.user.role}; Path=/; Max-Age=604800; SameSite=Lax; Secure`;
      }

      router.push("/dashboard");
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutRequest();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      // Clear cookies
      if (typeof document !== "undefined") {
        document.cookie =
          "has_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie =
          "role=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/login";
      } else {
        router.push("/login");
      }
      setLoading(false);
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
