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
  googleLogin: (payload?: { email?: string; name?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  requestLandlordStatus: (input: RequestLandlordInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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

  const googleLogin = async (payload?: { email?: string; name?: string; avatarUrl?: string }) => {
    const res = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload || {})
    });

    if (res.success && res.data) {
      const { user, tokens } = res.data;
      await saveAuthTokens(tokens.accessToken, tokens.refreshToken);
      setUser(user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Google sign-in failed' };
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
        register,
        requestLandlordStatus,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
