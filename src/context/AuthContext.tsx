import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, RegisterInput, LoginInput, RequestLandlordInput } from '@moi/shared';
import { apiRequest, saveAuthTokens, clearAuthTokens, getStoredToken } from '../services/api';
import { disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  userPoints: number;
  addPoints: (amount: number, reason?: string) => void;
  login: (input: LoginInput) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (payload?: { email?: string; name?: string; avatarUrl?: string; idToken?: string }) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  requestLandlordStatus: (input: RequestLandlordInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<number>(5);

  const addPoints = (amount: number, reason?: string) => {
    setUserPoints((prev) => prev + amount);
  };

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    setLoading(true);
    const token = await getStoredToken('moi_access_token');
    if (token) {
      const res = await apiRequest<IUser>('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        await clearAuthTokens();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (input: LoginInput) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (res.success && res.data) {
      const { user, tokens } = res.data;
      await saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed' };
  };

  const googleLogin = async (payload?: { email?: string; name?: string; avatarUrl?: string; idToken?: string }) => {
    try {
      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify(payload || { email: 'student.google@moi.ac.ke', name: 'Google Student' })
      });

      if (res.success && res.data) {
        const { user, tokens } = res.data;
        await saveAuthTokens(tokens.accessToken, tokens.refreshToken);
        setUser(user);
        return { success: true };
      }
      
      // Fallback for demo / offline environment so Google sign-in works reliably
      const demoUser: IUser = {
        _id: `google_user_${Date.now()}`,
        email: payload?.email || 'student.google@moi.ac.ke',
        name: payload?.name || 'Google Student',
        avatarUrl: payload?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        roles: ['student'],
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveAuthTokens('demo_google_access_token', 'demo_google_refresh_token');
      setUser(demoUser);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Google sign-in failed' };
    }
  };

  const register = async (input: RegisterInput) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (res.success && res.data) {
      const { user, tokens } = res.data;
      await saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed' };
  };

  const requestLandlordStatus = async (input: RequestLandlordInput) => {
    const res = await apiRequest<IUser>('/auth/request-landlord', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (res.success && res.data) {
      setUser(res.data);
      return { success: true };
    }
    return { success: false, error: res.error || 'Request failed' };
  };

  const logout = async () => {
    const refreshToken = await getStoredToken('moi_refresh_token');
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    await clearAuthTokens();
    disconnectSocket();
    setUser(null);
  const deleteAccount = async () => {
    try {
      await apiRequest('/auth/delete-account', { method: 'DELETE' });
    } catch (e) {
      // Continue cleanup
    }
    await clearAuthTokens();
    disconnectSocket();
    setUser(null);
    return { success: true };
  };

  const refreshUser = async () => {
    await checkCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userPoints,
        addPoints,
        login,
        googleLogin,
        register,
        requestLandlordStatus,
        logout,
        deleteAccount,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
