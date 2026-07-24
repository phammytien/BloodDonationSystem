import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OtpPage } from './pages/auth/OtpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { HomePage } from './pages/HomePage';
import { AppointmentPage } from './pages/AppointmentPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Đang tải...</span>
    </div>
  </div>
);

const isDonor = (role: string) => role.toLowerCase() === 'donor';

// Any authenticated user
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin / Staff only — Donors → home
const StaffAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isDonor(user.roleName)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Redirect already-logged-in users away from auth pages
const AnonymousRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <>{children}</>;
  // Donors go to home, Admin/Staff go to dashboard
  return <Navigate to={isDonor(user.roleName) ? '/' : '/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth pages — blocked for logged-in users */}
          <Route path="/login" element={<AnonymousRoute><LoginPage /></AnonymousRoute>} />
          <Route path="/register" element={<AnonymousRoute><RegisterPage /></AnonymousRoute>} />
          <Route path="/verify-otp" element={<AnonymousRoute><OtpPage /></AnonymousRoute>} />
          <Route path="/forgot-password" element={<AnonymousRoute><ForgotPasswordPage /></AnonymousRoute>} />

          {/* Public home */}
          <Route path="/" element={<HomePage />} />

          {/* Blood donation appointment — public page, but form requires auth */}
          <Route path="/appointment" element={<AppointmentPage />} />

          {/* Account and donor profile management */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

          {/* Admin / Staff dashboard — Donors are blocked */}
          <Route path="/dashboard" element={<StaffAdminRoute><DashboardPage /></StaffAdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
