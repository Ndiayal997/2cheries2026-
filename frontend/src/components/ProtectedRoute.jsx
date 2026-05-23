// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
