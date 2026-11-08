// ===========================================================================
// CIVORA — Auth Context
// Provides authentication state to the entire app.
// Token is persisted to localStorage as 'civora_token' and 'genesis_token'.
// ===========================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiLogin, apiRegister, apiGetMe, apiLogout, AuthUser } from '../services/authApi';

const TOKEN_KEY = 'civora_token';
const ALT_TOKEN_KEY = 'genesis_token';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ALT_TOKEN_KEY)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, verify stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ALT_TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    apiGetMe(storedToken)
      .then((u) => {
        setUser(u);
        setToken(storedToken);
        localStorage.setItem(TOKEN_KEY, storedToken);
        localStorage.setItem(ALT_TOKEN_KEY, storedToken);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ALT_TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const data = await apiLogin(username, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(ALT_TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      setError(msg);
      throw e;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setError(null);
    try {
      const data = await apiRegister(username, email, password);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(ALT_TOKEN_KEY, data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed';
      setError(msg);
      throw e;
    }
  }, []);

  const logout = useCallback(() => {
    if (token) apiLogout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ALT_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
