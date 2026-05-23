// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('2cheries_user');
    const token  = localStorage.getItem('2cheries_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('2cheries_token', data.token);
    localStorage.setItem('2cheries_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, phone, password) => {
    const { data } = await api.post('/auth/register', { name, email, phone, password });
    localStorage.setItem('2cheries_token', data.token);
    localStorage.setItem('2cheries_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const adminLogin = async (username, password) => {
    const { data } = await api.post('/auth/admin/login', { username, password });
    localStorage.setItem('2cheries_token', data.token);
    localStorage.setItem('2cheries_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('2cheries_token');
    localStorage.removeItem('2cheries_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, adminLogin, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
