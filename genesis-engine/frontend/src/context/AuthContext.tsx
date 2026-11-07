import React, { createContext, useContext, useState, useEffect } from 'react';
import { civilizationApi } from '../services/civilizationApi';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  loginAsDemo: (role: 'player' | 'admin') => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('genesis_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('genesis_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await civilizationApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('genesis_user', JSON.stringify(res.data));
      } else {
        // Token expired or invalid, auto fallback to player1 demo
        await loginAsDemo('player');
      }
    } catch {
      // Offline or network error
    }
  };

  useEffect(() => {
    if (token) {
      refreshUserProfile();
    } else {
      // Default auto-login as player1 for seamless out-of-the-box playability
      loginAsDemo('player');
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await civilizationApi.login(username, password);
    if (res.success && res.data) {
      setToken(res.data.access_token);
      setUser(res.data.user);
      localStorage.setItem('genesis_token', res.data.access_token);
      localStorage.setItem('genesis_user', JSON.stringify(res.data.user));
      return { success: true };
    }
    return { success: false, message: res.message || 'Invalid credentials' };
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await civilizationApi.register(username, email, password);
    if (res.success && res.data) {
      setToken(res.data.access_token);
      setUser(res.data.user);
      localStorage.setItem('genesis_token', res.data.access_token);
      localStorage.setItem('genesis_user', JSON.stringify(res.data.user));
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('genesis_token');
    localStorage.removeItem('genesis_user');
  };

  const loginAsDemo = async (role: 'player' | 'admin') => {
    const creds = role === 'admin'
      ? { u: 'admin', p: 'AdminPassword123!' }
      : { u: 'player1', p: 'UserPassword123!' };
    await login(creds.u, creds.p);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        register,
        logout,
        loginAsDemo,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

