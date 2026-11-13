import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [manager, setManager] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('queueflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('queueflow_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data.success) {
          setManager(res.data.manager);
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        localStorage.removeItem('queueflow_token');
        localStorage.removeItem('queueflow_manager');
        setToken(null);
        setManager(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { token: receivedToken, manager: managerData } = res.data;
      localStorage.setItem('queueflow_token', receivedToken);
      localStorage.setItem('queueflow_manager', JSON.stringify(managerData));
      setToken(receivedToken);
      setManager(managerData);
      return managerData;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data.success) {
      const { token: receivedToken, manager: managerData } = res.data;
      localStorage.setItem('queueflow_token', receivedToken);
      localStorage.setItem('queueflow_manager', JSON.stringify(managerData));
      setToken(receivedToken);
      setManager(managerData);
      return managerData;
    }
  };

  const logout = () => {
    localStorage.removeItem('queueflow_token');
    localStorage.removeItem('queueflow_manager');
    setToken(null);
    setManager(null);
    window.location.href = '/login';
  };

  const value = {
    manager,
    token,
    loading,
    isAuthenticated: Boolean(token && manager),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
