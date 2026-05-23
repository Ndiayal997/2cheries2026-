// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bordeaux-deep)',
                color: 'var(--white)',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '0.82rem',
                borderLeft: '4px solid var(--gold)',
                borderRadius: '3px',
              },
              success: { iconTheme: { primary: '#4ade80', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* Public */}
            <Route path="/" element={<><Navbar /><HomePage /></>} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Client protected */}
            <Route path="/mes-commandes" element={
              <RequireAuth>
                <Navbar />
                <MyOrdersPage />
              </RequireAuth>
            } />

            {/* Admin protected */}
            <Route path="/admin" element={
              <RequireAdmin>
                <Navbar />
                <AdminDashboardPage />
              </RequireAdmin>
            } />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
